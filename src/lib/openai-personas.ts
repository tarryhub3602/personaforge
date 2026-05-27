import OpenAI from "openai";
import { normalizePersonas } from "@/lib/persona-utils";
import type { GeneratePersonasResponse, Persona } from "@/types/persona";

export const PERSONAS_SYSTEM_PROMPT = `Tu es un expert en marketing et en création de personas clients ultra-réalistes.
À partir de la description d'un produit ou service, génère exactement 3 personas marketing détaillés, concrets et distincts.

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "personas": [
    {
      "prenom": "string",
      "age": number,
      "job": "string",
      "revenusApproximatifs": "string (fourchette réaliste en euros, ex: 2 800–3 200 € nets/mois)",
      "situationFamiliale": "string (détaillée : statut, enfants, logement, rythme de vie)",
      "applicationsQuotidiennes": ["string", "string", "string", "string"],
      "anecdoteQuotidienne": "string (scène concrète et vivante du quotidien, 2-3 phrases)",
      "frustrations": ["string", "string", "string"],
      "motivations": ["string", "string", "string"],
      "objections": ["string", "string", "string"],
      "citation": "string — une phrase typique que ce persona dirait"
    }
  ]
}

Règles :
- Les 3 personas doivent être très variés (âge, secteur, profil psychologique, milieu social)
- Pour chaque persona, génère un prénom différent et varié, en piochant dans des origines diverses : français, maghrébin, africain, anglophone, espagnol, asiatique. Ne jamais répéter les mêmes prénoms.
- Chaque persona doit être SPÉCIFIQUE et CONCRET (pas de généralités vagues)
- applicationsQuotidiennes : exactement 4 apps/outils/web utilisés chaque jour, réalistes pour ce profil
- revenusApproximatifs et situationFamiliale : cohérents avec le job et l'âge
- anecdoteQuotidienne : un moment précis et sensoriel (lieu, heure, action, émotion)
- Tout le contenu en français
- frustrations, motivations et objections : exactement 3 éléments chacun, formulés de façon précise`;

function parsePersonas(content: string): Persona[] {
  const parsed = JSON.parse(content) as GeneratePersonasResponse;

  if (!Array.isArray(parsed.personas) || parsed.personas.length !== 3) {
    throw new Error("Format de réponse invalide");
  }

  return normalizePersonas(parsed.personas);
}

export async function generatePersonasFromDescription(
  productDescription: string,
): Promise<Persona[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Clé API OpenAI non configurée. Ajoutez OPENAI_API_KEY dans .env.local",
    );
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4-mini",
    messages: [
      { role: "system", content: PERSONAS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Produit / service à analyser :\n\n${productDescription}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.85,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Réponse vide de l'API OpenAI");
  }

  return parsePersonas(content);
}
