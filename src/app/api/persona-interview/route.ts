import { NextRequest, NextResponse } from "next/server";
import {
  canDownloadPdf,
  getClientIp,
} from "@/lib/ip-limit";
import { normalizePersonas } from "@/lib/persona-utils";
import {
  replyAsPersona,
  type InterviewMessage,
} from "@/lib/persona-interview";
import type { Persona } from "@/types/persona";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMessages(raw: unknown): InterviewMessage[] {
  if (!Array.isArray(raw)) return [];

  const messages: InterviewMessage[] = [];

  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.trim()
    ) {
      messages.push({
        role: item.role,
        content: item.content.trim(),
      });
    }
  }

  return messages;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const access = { request };

    if (!(await canDownloadPdf(ip, access))) {
      return NextResponse.json(
        {
          error:
            "L'interview persona est réservée aux offres One-shot et Pro.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const rawPersona = body.persona as Partial<Persona> | undefined;

    if (!rawPersona || typeof rawPersona !== "object") {
      return NextResponse.json(
        { error: "Persona invalide" },
        { status: 400 },
      );
    }

    const persona = normalizePersonas([rawPersona])[0];
    const messages = parseMessages(body.messages);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Au moins un message utilisateur est requis" },
        { status: 400 },
      );
    }

    const last = messages[messages.length - 1];
    if (last.role !== "user") {
      return NextResponse.json(
        { error: "Le dernier message doit venir de l'utilisateur" },
        { status: 400 },
      );
    }

    if (messages.length > 40) {
      return NextResponse.json(
        { error: "Conversation trop longue (max. 40 messages)" },
        { status: 400 },
      );
    }

    const productDescription =
      typeof body.productDescription === "string"
        ? body.productDescription.trim()
        : undefined;

    const reply = await replyAsPersona(
      persona,
      messages,
      productDescription,
    );

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[persona-interview]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de l'interview";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
