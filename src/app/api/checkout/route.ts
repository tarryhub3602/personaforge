import { NextRequest, NextResponse } from "next/server";
import { getStripeCancelUrl, getStripeSuccessUrl } from "@/lib/app-url";
import { saveCheckoutSession } from "@/lib/checkout-sessions";
import { getClientIp } from "@/lib/ip-limit";
import { normalizePersonas } from "@/lib/persona-utils";
import { getStripe } from "@/lib/stripe";
import type { Persona } from "@/types/persona";

const METADATA_MAX = 500;

function truncateForMetadata(value: string): string {
  return value.length <= METADATA_MAX
    ? value
    : value.slice(0, METADATA_MAX - 3) + "...";
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const clientIp = getClientIp(request);
    const body = await request.json().catch(() => ({}));
    const plan =
      body?.plan === "pro" ? "pro" : ("oneshot" as "oneshot" | "pro");

    const productDescription =
      typeof body.productDescription === "string"
        ? body.productDescription.trim()
        : "";

    let personas: Persona[] | undefined;
    if (Array.isArray(body.personas) && body.personas.length === 3) {
      personas = normalizePersonas(body.personas);
    }

    const successUrl = getStripeSuccessUrl(plan);
    const cancelUrl = getStripeCancelUrl();

    const metadata = {
      client_ip: clientIp,
      plan,
      ...(productDescription
        ? { product_description: truncateForMetadata(productDescription) }
        : {}),
    };

    const session =
      plan === "pro"
        ? await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
              {
                price_data: {
                  currency: "eur",
                  unit_amount: 900,
                  recurring: { interval: "month" },
                  product_data: {
                    name: "PersonaForge Pro",
                    description:
                      "Générations illimitées, PDF illimité et historique complet",
                  },
                },
                quantity: 1,
              },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata,
          })
        : await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [
              {
                price_data: {
                  currency: "eur",
                  unit_amount: 400,
                  product_data: {
                    name: "PersonaForge — One-shot",
                    description:
                      "Débloquez vos 3 personas premium + PDF + historique 3 mois",
                  },
                },
                quantity: 1,
              },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata,
          });

    if (!session.url) {
      throw new Error("URL de session Stripe introuvable");
    }

    await saveCheckoutSession({
      sessionId: session.id,
      productDescription,
      personas,
      plan,
      clientIp,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      plan,
    });
  } catch (error) {
    console.error("[checkout]", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors du paiement";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
