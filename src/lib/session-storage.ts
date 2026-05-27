import type { Persona } from "@/types/persona";
import { normalizePersonas } from "@/lib/persona-utils";

const SESSION_PREFIX = "personaforge_session_";

export type SessionPersonasData = {
  sessionId: string;
  personas: Persona[];
  productDescription: string;
  savedAt: string;
};

export function saveSessionPersonas(
  sessionId: string,
  personas: Persona[],
  productDescription: string,
): void {
  if (typeof window === "undefined") return;

  const data: SessionPersonasData = {
    sessionId,
    personas,
    productDescription,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(data));
}

export function loadSessionPersonas(
  sessionId: string,
): SessionPersonasData | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SessionPersonasData;
    if (parsed.sessionId !== sessionId) return null;

    return {
      ...parsed,
      personas: normalizePersonas(parsed.personas),
    };
  } catch {
    localStorage.removeItem(`${SESSION_PREFIX}${sessionId}`);
    return null;
  }
}

export function clearSessionPersonas(sessionId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${SESSION_PREFIX}${sessionId}`);
}
