import type { Persona } from "@/types/persona";
import {
  buildCheckoutPersonasPayload,
  extractPersonasFromRow,
  formatCheckoutDescription,
  getGenerationByCheckoutSessionId,
  insertGeneration,
  parseCheckoutDescription,
} from "@/lib/generations";

export type CheckoutSessionRecord = {
  sessionId: string;
  productDescription: string;
  personas?: Persona[];
  plan: "oneshot" | "pro";
  clientIp: string;
  createdAt: string;
};

export async function saveCheckoutSession(
  record: CheckoutSessionRecord,
): Promise<void> {
  await insertGeneration({
    ip: record.clientIp,
    plan: record.plan,
    description: formatCheckoutDescription(
      record.sessionId,
      record.productDescription,
    ),
    personas: buildCheckoutPersonasPayload(record.personas),
    expires_at: null,
  });
}

export async function getCheckoutSession(
  sessionId: string,
): Promise<CheckoutSessionRecord | null> {
  const row = await getGenerationByCheckoutSessionId(sessionId);
  if (!row?.description) return null;

  const parsed = parseCheckoutDescription(row.description);
  if (!parsed || parsed.sessionId !== sessionId) return null;

  const personas = extractPersonasFromRow(row) ?? undefined;

  return {
    sessionId,
    productDescription: parsed.productDescription,
    personas,
    plan: row.plan === "pro" ? "pro" : "oneshot",
    clientIp: row.ip,
    createdAt: row.created_at,
  };
}

export function isStripeSessionPaid(session: {
  status: string | null;
  payment_status: string | null;
  mode: string;
}): boolean {
  if (session.status !== "complete") return false;

  return (
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required"
  );
}
