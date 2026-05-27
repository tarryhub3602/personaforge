import type { Persona } from "@/types/persona";
import { normalizePersonas } from "@/lib/persona-utils";

const ONE_SHOT_MS = 90 * 24 * 60 * 60 * 1000;
const PRO_GRACE_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_SHOT_PREFIX = "personaforge_oneshot_";
const PRO_PREFIX = "personaforge_pro_";

export type OneShotHistory = {
  ip: string;
  personas: Persona[];
  productDescription: string;
  savedAt: string;
  expiresAt: string;
};

export type ProHistoryEntry = {
  id: string;
  personas: Persona[];
  productDescription: string;
  createdAt: string;
};

export type ProHistoryStore = {
  ip: string;
  entries: ProHistoryEntry[];
  subscriptionActive: boolean;
  cancelledAt: string | null;
  historyExpiresAt: string | null;
};

export type HistoryListItem = {
  id: string;
  personas: Persona[];
  productDescription: string;
  createdAt: string;
  plan: "oneshot" | "pro";
};

function oneshotKey(ip: string) {
  return `${ONE_SHOT_PREFIX}${ip}`;
}

function proKey(ip: string) {
  return `${PRO_PREFIX}${ip}`;
}

function isExpired(isoDate: string): boolean {
  return new Date(isoDate).getTime() < Date.now();
}

export function saveOneShotHistory(
  ip: string,
  personas: Persona[],
  productDescription: string,
): void {
  if (typeof window === "undefined") return;

  const savedAt = new Date().toISOString();
  const data: OneShotHistory = {
    ip,
    personas,
    productDescription,
    savedAt,
    expiresAt: new Date(Date.now() + ONE_SHOT_MS).toISOString(),
  };

  localStorage.setItem(oneshotKey(ip), JSON.stringify(data));
}

export function getOneShotHistory(ip: string): OneShotHistory | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(oneshotKey(ip));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OneShotHistory;
    if (parsed.ip !== ip || isExpired(parsed.expiresAt)) {
      localStorage.removeItem(oneshotKey(ip));
      return null;
    }
    parsed.personas = normalizePersonas(parsed.personas);
    return parsed;
  } catch {
    localStorage.removeItem(oneshotKey(ip));
    return null;
  }
}

/** Récupère l'historique one-shot même si l'IP a changé (ex. localhost) */
export function findOneShotHistoryAny(): OneShotHistory | null {
  if (typeof window === "undefined") return null;

  let latest: OneShotHistory | null = null;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(ONE_SHOT_PREFIX)) continue;

    const ip = key.slice(ONE_SHOT_PREFIX.length);
    const entry = getOneShotHistory(ip);
    if (!entry) continue;

    if (
      !latest ||
      new Date(entry.savedAt).getTime() > new Date(latest.savedAt).getTime()
    ) {
      latest = entry;
    }
  }

  return latest;
}

export function hasOneShotHistory(ip?: string): boolean {
  if (ip) return getOneShotHistory(ip) !== null;
  return findOneShotHistoryAny() !== null;
}

export function initProHistory(ip: string, subscriptionActive: boolean): void {
  if (typeof window === "undefined") return;

  const existing = getProHistoryRaw(ip);
  const store: ProHistoryStore = existing ?? {
    ip,
    entries: [],
    subscriptionActive,
    cancelledAt: null,
    historyExpiresAt: null,
  };

  store.subscriptionActive = subscriptionActive;
  if (subscriptionActive) {
    store.cancelledAt = null;
    store.historyExpiresAt = null;
  }

  localStorage.setItem(proKey(ip), JSON.stringify(store));
}

export function markProCancelled(ip: string): void {
  if (typeof window === "undefined") return;

  const store = getProHistoryRaw(ip);
  if (!store) return;

  store.subscriptionActive = false;
  store.cancelledAt = new Date().toISOString();
  store.historyExpiresAt = new Date(Date.now() + PRO_GRACE_MS).toISOString();

  localStorage.setItem(proKey(ip), JSON.stringify(store));
}

function getProHistoryRaw(ip: string): ProHistoryStore | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(proKey(ip));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ProHistoryStore;
  } catch {
    return null;
  }
}

export function getProHistory(ip: string): ProHistoryStore | null {
  if (typeof window === "undefined") return null;

  const store = getProHistoryRaw(ip);
  if (!store || store.ip !== ip) return null;

  if (
    !store.subscriptionActive &&
    store.historyExpiresAt &&
    isExpired(store.historyExpiresAt)
  ) {
    localStorage.removeItem(proKey(ip));
    return null;
  }

  store.entries = store.entries.map((e) => ({
    ...e,
    personas: normalizePersonas(e.personas),
  }));

  return store;
}

export function addProHistoryEntry(
  ip: string,
  personas: Persona[],
  productDescription: string,
): void {
  if (typeof window === "undefined") return;

  let store = getProHistory(ip) ?? getProHistoryRaw(ip);

  if (!store) {
    store = {
      ip,
      entries: [],
      subscriptionActive: true,
      cancelledAt: null,
      historyExpiresAt: null,
    };
  }

  store.entries.unshift({
    id: crypto.randomUUID(),
    personas,
    productDescription,
    createdAt: new Date().toISOString(),
  });

  localStorage.setItem(proKey(ip), JSON.stringify(store));
}

export function getUnifiedHistory(ip: string): HistoryListItem[] {
  const items: HistoryListItem[] = [];

  const oneshot = getOneShotHistory(ip) ?? findOneShotHistoryAny();
  if (oneshot) {
    items.push({
      id: "oneshot",
      personas: oneshot.personas,
      productDescription: oneshot.productDescription,
      createdAt: oneshot.savedAt,
      plan: "oneshot",
    });
  }

  const pro = getProHistory(ip);
  if (pro) {
    for (const entry of pro.entries) {
      items.push({
        id: entry.id,
        personas: entry.personas,
        productDescription: entry.productDescription,
        createdAt: entry.createdAt,
        plan: "pro",
      });
    }
  }

  return items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getHistoryEntryById(
  ip: string,
  entryId: string,
): HistoryListItem | null {
  return getUnifiedHistory(ip).find((e) => e.id === entryId) ?? null;
}

export function clearUserLocalHistory(ip?: string): void {
  if (typeof window === "undefined") return;

  if (ip) {
    localStorage.removeItem(oneshotKey(ip));
    localStorage.removeItem(proKey(ip));
    return;
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key?.startsWith(ONE_SHOT_PREFIX) ||
      key?.startsWith(PRO_PREFIX) ||
      key?.startsWith("personaforge_session_")
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
