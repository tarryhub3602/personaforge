import type { Persona } from "@/types/persona";

export function normalizePersona(raw: Partial<Persona>): Persona {
  return {
    prenom: raw.prenom ?? "Inconnu",
    age: typeof raw.age === "number" ? raw.age : 30,
    job: raw.job ?? "—",
    revenusApproximatifs: raw.revenusApproximatifs ?? "Non précisé",
    situationFamiliale: raw.situationFamiliale ?? "Non précisée",
    applicationsQuotidiennes: Array.isArray(raw.applicationsQuotidiennes)
      ? raw.applicationsQuotidiennes
      : [],
    anecdoteQuotidienne: raw.anecdoteQuotidienne ?? "",
    frustrations: Array.isArray(raw.frustrations) ? raw.frustrations : [],
    motivations: Array.isArray(raw.motivations) ? raw.motivations : [],
    objections: Array.isArray(raw.objections) ? raw.objections : [],
    citation: raw.citation ?? "",
  };
}

export function normalizePersonas(list: Partial<Persona>[]): Persona[] {
  return list.map(normalizePersona);
}
