import {
  clearGeneratedAt,
  clearUnlocked,
} from "@/lib/personas-storage";
import { clearUserLocalHistory } from "@/lib/history-storage";

const SESSION_KEYS = [
  "personaforge_personas",
  "personaforge_unlocked",
  "personaforge_generated_at",
  "personaforge_description",
] as const;

export function logoutUser(ip?: string): void {
  if (typeof window === "undefined") return;

  SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
  clearUnlocked();
  clearGeneratedAt();
  clearUserLocalHistory(ip);
}

export function getPlanLabel(plan: string): string {
  switch (plan) {
    case "pro":
      return "Pro — 19€/mois";
    case "oneshot":
      return "One-shot — 9€";
    default:
      return "Gratuit";
  }
}
