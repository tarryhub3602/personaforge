import { NextRequest, NextResponse } from "next/server";
import { generatePdfFromHtml } from "@/lib/generate-pdf-puppeteer";
import { buildPersonasPdfHtml } from "@/lib/personas-pdf-html";
import { normalizePersonas } from "@/lib/persona-utils";
import type { Persona } from "@/types/persona";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPersonas = body.personas as Partial<Persona>[] | undefined;

    if (!Array.isArray(rawPersonas) || rawPersonas.length !== 3) {
      return NextResponse.json(
        { error: "3 personas requis pour générer le PDF" },
        { status: 400 },
      );
    }

    const personas = normalizePersonas(rawPersonas);
    const generatedAt =
      typeof body.generatedAt === "string" && body.generatedAt.trim()
        ? body.generatedAt.trim()
        : new Date().toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

    const html = buildPersonasPdfHtml(personas, generatedAt);
    const pdfBuffer = await generatePdfFromHtml(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="personaforge-personas-${Date.now()}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[generate-pdf]", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la génération du PDF";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
