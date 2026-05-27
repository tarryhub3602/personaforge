import { NextRequest, NextResponse } from "next/server";
import {
  getCheckoutSession,
  isStripeSessionPaid,
  saveCheckoutSession,
} from "@/lib/checkout-sessions";
import { getClientIp, markIpOneShot, markIpPro } from "@/lib/ip-limit";
import { generatePersonasFromDescription } from "@/lib/openai-personas";
import { getStripe } from "@/lib/stripe";
import type { Persona } from "@/types/persona";

async function verifyAndMarkPaid(sessionId: string, request: NextRequest) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const ipFromStripe = session.metadata?.client_ip;
  const ip =
    ipFromStripe && ipFromStripe.length > 0
      ? ipFromStripe
      : getClientIp(request);

  const isSubscription = session.mode === "subscription";
  const paid = isStripeSessionPaid(session);

  if (paid) {
    if (isSubscription && session.subscription) {
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      await markIpPro(ip, subId);
    } else {
      await markIpOneShot(ip);
    }
  }

  const stored = await getCheckoutSession(sessionId);
  const productDescription =
    stored?.productDescription ??
    session.metadata?.product_description ??
    "";

  return {
    session,
    paid,
    ip,
    plan: (isSubscription ? "pro" : "oneshot") as "pro" | "oneshot",
    productDescription,
    storedPersonas: stored?.personas ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id manquant", paid: false },
        { status: 400 },
      );
    }

    const result = await verifyAndMarkPaid(sessionId, request);

    return NextResponse.json({
      paid: result.paid,
      plan: result.plan,
      ip: result.ip,
      productDescription: result.productDescription,
      hasStoredPersonas: Boolean(result.storedPersonas?.length === 3),
    });
  } catch (error) {
    console.error("[checkout/verify]", error);
    return NextResponse.json(
      { paid: false, error: "Vérification Stripe échouée" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId =
      typeof body.session_id === "string" ? body.session_id.trim() : "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id manquant" },
        { status: 400 },
      );
    }

    const result = await verifyAndMarkPaid(sessionId, request);

    if (!result.paid) {
      return NextResponse.json(
        { error: "Paiement non confirmé", paid: false },
        { status: 402 },
      );
    }

    let personas: Persona[] | null = result.storedPersonas;

    if (!personas || personas.length !== 3) {
      const description = result.productDescription.trim();

      if (description.length < 20) {
        return NextResponse.json(
          {
            error:
              "Description produit introuvable — impossible de régénérer les personas",
          },
          { status: 404 },
        );
      }

      personas = await generatePersonasFromDescription(description);
    }

    return NextResponse.json({
      paid: true,
      plan: result.plan,
      ip: result.ip,
      personas,
      productDescription: result.productDescription,
      regenerated: !result.storedPersonas,
    });
  } catch (error) {
    console.error("[checkout/recover]", error);
    const message =
      error instanceof Error ? error.message : "Récupération impossible";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
