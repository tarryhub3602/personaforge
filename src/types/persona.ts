export interface Persona {
  prenom: string;
  age: number;
  job: string;
  revenusApproximatifs: string;
  situationFamiliale: string;
  applicationsQuotidiennes: string[];
  anecdoteQuotidienne: string;
  frustrations: string[];
  motivations: string[];
  objections: string[];
  citation: string;
}

export interface GeneratePersonasResponse {
  personas: Persona[];
}

export type PlanType = "free" | "oneshot" | "pro";

export interface IpStatusResponse {
  ip: string;
  plan: PlanType;
  canGenerate: boolean;
  canDownloadPdf: boolean;
  hasOneshotHistory: boolean;
  proHistoryCount: number;
}
