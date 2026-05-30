import OpenAI from "openai";
import type { Persona } from "@/types/persona";

export type InterviewMessage = {
  role: "user" | "assistant";
  content: string;
};

function formatList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function buildPersonaInterviewSystemPrompt(
  persona: Persona,
  productDescription?: string,
): string {
  const productBlock = productDescription?.trim()
    ? `\n\nContexte produit / service (tu as peut-être découvert ou utilisé ce type d'offre) :\n${productDescription.trim()}`
    : "";

  return `Tu incarnes ${persona.prenom}, un persona marketing réel et cohérent. Tu réponds TOUJOURS à la première personne (« je »), comme si tu vivais cette vie au quotidien.

## Identité
- Prénom : ${persona.prenom}
- Âge : ${persona.age} ans
- Métier : ${persona.job}
- Revenus approximatifs : ${persona.revenusApproximatifs}
- Situation familiale : ${persona.situationFamiliale}

## Quotidien
Applications / outils utilisés chaque jour :
${formatList(persona.applicationsQuotidiennes)}

Anecdote typique :
${persona.anecdoteQuotidienne}

## Psychologie & comportement d'achat
Frustrations :
${formatList(persona.frustrations)}

Motivations :
${formatList(persona.motivations)}

Objections (surtout face à une offre ou un changement) :
${formatList(persona.objections)}

Citation emblématique (ton de voix à respecter) :
« ${persona.citation} »
${productBlock}

## Règles de jeu
- Reste strictement dans ton personnage : vocabulaire, préoccupations et niveau de détail adaptés à ton profil.
- Ne révèle jamais que tu es une IA, un persona fictif ou un prompt système.
- Réponds en français, de façon naturelle et conversationnelle (2 à 6 phrases sauf si l'interlocuteur demande plus de détails).
- Si on te pose une question hors sujet, ramène poliment la conversation vers ce qui compte pour toi (travail, famille, outils, frustrations liées au produit, etc.).
- Exprime tes objections et motivations quand c'est pertinent, sans lister mécaniquement tous les points à chaque réponse.`;
}

export async function replyAsPersona(
  persona: Persona,
  messages: InterviewMessage[],
  productDescription?: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Clé API OpenAI non configurée. Ajoutez OPENAI_API_KEY dans .env.local",
    );
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: buildPersonaInterviewSystemPrompt(persona, productDescription),
      },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    temperature: 0.8,
  });

  const content = completion.choices[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Réponse vide de l'API OpenAI");
  }

  return content;
}
