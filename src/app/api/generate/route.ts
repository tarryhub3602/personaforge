import {
  FREE_LIMIT_MESSAGE,
  canGenerate,
  getClientIp,
  getPlan,
  saveGeneration,
} from "@/lib/ip-limit";
import { generatePersonasFromDescription } from "@/lib/openai-personas";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productDescription =
      typeof body.productDescription === "string"
        ? body.productDescription.trim()
        : "";

    if (!productDescription || productDescription.length < 20) {
      return NextResponse.json(
        { error: "Décrivez votre produit en au moins 20 caractères." },
        { status: 400 },
      );
    }

    const ip = getClientIp(request);
    const access = { request };

    if (!(await canGenerate(ip, access))) {
      return NextResponse.json(
        {
          error: FREE_LIMIT_MESSAGE,
          limitReached: true,
        },
        { status: 403 },
      );
    }

    const personas = await generatePersonasFromDescription(productDescription);
    const plan = await getPlan(ip, access);

    await saveGeneration(ip, plan, productDescription, personas);

    return NextResponse.json({
      personas,
      plan,
      productDescription,
    });
  } catch (error) {
    console.error("[generate]", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
