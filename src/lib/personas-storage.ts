import type { Persona } from "@/types/persona";
import { normalizePersonas } from "@/lib/persona-utils";

const PERSONAS_KEY = "personaforge_personas";
const UNLOCKED_KEY = "personaforge_unlocked";
const GENERATED_AT_KEY = "personaforge_generated_at";
const DESCRIPTION_KEY = "personaforge_description";

export function savePersonas(personas: Persona[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
  if (!sessionStorage.getItem(GENERATED_AT_KEY)) {
    sessionStorage.setItem(GENERATED_AT_KEY, new Date().toISOString());
  }
}

export function setGeneratedAt(isoDate: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GENERATED_AT_KEY, isoDate);
}

export function clearSessionPersonas(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PERSONAS_KEY);
  sessionStorage.removeItem(DESCRIPTION_KEY);
  clearGeneratedAt();
}

export function saveProductDescription(description: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DESCRIPTION_KEY, description);
}

export function getProductDescription(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(DESCRIPTION_KEY) ?? "";
}

export function getGeneratedAtLabel(): string {
  if (typeof window === "undefined") {
    return new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const raw = sessionStorage.getItem(GENERATED_AT_KEY);
  const date = raw ? new Date(raw) : new Date();

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function loadPersonas(): Persona[] | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(PERSONAS_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Persona>[];
    return Array.isArray(parsed) && parsed.length === 3
      ? normalizePersonas(parsed)
      : null;
  } catch {
    return null;
  }
}

export function markUnlocked(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(UNLOCKED_KEY, "true");
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(UNLOCKED_KEY) === "true";
}

export function clearUnlocked(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(UNLOCKED_KEY);
}

export function clearGeneratedAt(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GENERATED_AT_KEY);
}
