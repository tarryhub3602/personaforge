import type { Persona, PlanType } from "@/types/persona";
import { normalizePersonas } from "@/lib/persona-utils";
import { getSupabaseServerClient } from "@/lib/supabase";

export type GenerationRow = {
  id: string;
  ip: string;
  plan: PlanType;
  description: string | null;
  personas: unknown;
  created_at: string;
  expires_at: string | null;
};

export type ProSubscriptionMeta = {
  subscriptionId: string;
  proActive: boolean;
  proCancelledAt: string | null;
  proPeriodEnd?: string;
};

const CHECKOUT_DESC_PREFIX = "__checkout:";

export function isCheckoutDescription(description: string | null): boolean {
  return Boolean(description?.startsWith(CHECKOUT_DESC_PREFIX));
}

export function formatCheckoutDescription(
  sessionId: string,
  productDescription: string,
): string {
  return `${CHECKOUT_DESC_PREFIX}${sessionId}__\n${productDescription}`;
}

export function parseCheckoutDescription(description: string): {
  sessionId: string;
  productDescription: string;
} | null {
  const match = description.match(/^__checkout:(.+?)__\n([\s\S]*)$/);
  if (!match) return null;
  return { sessionId: match[1], productDescription: match[2] };
}

function isRowActive(row: GenerationRow): boolean {
  return !row.expires_at || new Date(row.expires_at) > new Date();
}

function isEntitlementRow(row: GenerationRow): boolean {
  return !isCheckoutDescription(row.description);
}

function supabaseError(context: string, message: string): never {
  throw new Error(`[supabase:${context}] ${message}`);
}

export async function listGenerationsByIp(ip: string): Promise<GenerationRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select("id, ip, plan, description, personas, created_at, expires_at")
    .eq("ip", ip)
    .order("created_at", { ascending: false });

  if (error) supabaseError("listGenerationsByIp", error.message);
  return (data ?? []) as GenerationRow[];
}

export async function getGenerationByCheckoutSessionId(
  sessionId: string,
): Promise<GenerationRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select("id, ip, plan, description, personas, created_at, expires_at")
    .like("description", `${CHECKOUT_DESC_PREFIX}${sessionId}__%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) supabaseError("getGenerationByCheckoutSessionId", error.message);
  return (data as GenerationRow | null) ?? null;
}

export async function insertGeneration(input: {
  ip: string;
  plan: PlanType;
  description: string;
  personas: unknown;
  expires_at?: string | null;
}): Promise<GenerationRow> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .insert({
      ip: input.ip,
      plan: input.plan,
      description: input.description,
      personas: input.personas,
      expires_at: input.expires_at ?? null,
    })
    .select("id, ip, plan, description, personas, created_at, expires_at")
    .single();

  if (error) supabaseError("insertGeneration", error.message);
  return data as GenerationRow;
}

export async function updateGenerationPersonas(
  id: string,
  personas: unknown,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("generations")
    .update({ personas })
    .eq("id", id);

  if (error) supabaseError("updateGenerationPersonas", error.message);
}

export async function deleteAllGenerations(): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("generations")
    .delete()
    .not("id", "is", null);

  if (error) supabaseError("deleteAllGenerations", error.message);
}

export function getActivePaidGeneration(
  rows: GenerationRow[],
): GenerationRow | null {
  return (
    rows.find(
      (row) =>
        isEntitlementRow(row) &&
        (row.plan === "oneshot" || row.plan === "pro") &&
        isRowActive(row),
    ) ?? null
  );
}

export function hasUsedFreeGeneration(rows: GenerationRow[]): boolean {
  return rows.some((row) => row.plan === "free" && isEntitlementRow(row));
}

export function extractPersonasFromRow(row: GenerationRow): Persona[] | null {
  const raw = row.personas;
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length === 3) {
    return normalizePersonas(raw as Partial<Persona>[]);
  }
  if (
    typeof raw === "object" &&
    raw !== null &&
    "list" in raw &&
    Array.isArray((raw as { list: unknown }).list)
  ) {
    const list = (raw as { list: Partial<Persona>[] }).list;
    if (list.length === 3) return normalizePersonas(list);
  }
  return null;
}

export function getProMetaFromRow(row: GenerationRow): ProSubscriptionMeta | null {
  const raw = row.personas;
  if (
    typeof raw === "object" &&
    raw !== null &&
    "_pro" in raw &&
    typeof (raw as { _pro: unknown })._pro === "object"
  ) {
    return (raw as { _pro: ProSubscriptionMeta })._pro;
  }
  return null;
}

export function buildProPersonasPayload(meta: ProSubscriptionMeta): {
  _pro: ProSubscriptionMeta;
} {
  return { _pro: meta };
}

export function buildCheckoutPersonasPayload(
  personas?: Persona[],
): Persona[] | { list: Persona[] | null } {
  if (personas?.length === 3) return personas;
  return { list: personas ?? null };
}

export function oneshotExpiresAt(): string {
  return new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();
}
