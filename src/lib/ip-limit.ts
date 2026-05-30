import type { NextRequest } from "next/server";
import type { IpEntry, Persona, PlanType } from "@/types/persona";
import {
  buildProPersonasPayload,
  deleteAllGenerations,
  getActivePaidGeneration,
  getProMetaFromRow,
  hasUsedFreeGeneration,
  insertGeneration,
  listGenerationsByIp,
  oneshotExpiresAt,
  updateGenerationPersonas,
  type ProSubscriptionMeta,
} from "@/lib/generations";
import {
  buildAdminProEntry,
  hasAdminAccess,
} from "@/lib/admin-access";
import { getAdminIpEntry, getDevIpEntry } from "@/lib/ips-json";
import { getStripe } from "@/lib/stripe";

export type IpAccessContext = {
  request?: NextRequest;
};

export const FREE_LIMIT_MESSAGE =
  "Vous avez utilisé votre génération gratuite — débloquez vos 3 personas pour 4€";

export type { IpEntry } from "@/types/persona";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();

  return "127.0.0.1";
}

async function syncProSubscription(
  rowId: string,
  meta: ProSubscriptionMeta,
): Promise<ProSubscriptionMeta> {
  if (meta.subscriptionId.startsWith("admin:")) {
    return meta;
  }

  try {
    const stripe = getStripe();
    const sub = (await stripe.subscriptions.retrieve(
      meta.subscriptionId,
    )) as unknown as {
      status: string;
      cancel_at_period_end: boolean;
      current_period_end?: number;
    };

    meta.proActive = sub.status === "active" || sub.status === "trialing";
    const periodEnd =
      typeof sub.current_period_end === "number"
        ? sub.current_period_end
        : Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    meta.proPeriodEnd = new Date(periodEnd * 1000).toISOString();

    if (sub.cancel_at_period_end && !meta.proCancelledAt) {
      meta.proCancelledAt = new Date().toISOString();
    }

    if (sub.status === "canceled" || sub.status === "unpaid") {
      meta.proActive = false;
      if (!meta.proCancelledAt) {
        meta.proCancelledAt = new Date().toISOString();
      }
    }
  } catch {
    meta.proActive = false;
  }

  await updateGenerationPersonas(rowId, buildProPersonasPayload(meta));
  return meta;
}

function isProActive(meta: ProSubscriptionMeta): boolean {
  if (!meta.proActive) return false;
  if (meta.proPeriodEnd) {
    return new Date(meta.proPeriodEnd) > new Date();
  }
  return true;
}

function isDevProEntryActive(entry: IpEntry): boolean {
  if (entry.plan !== "pro") return false;
  if (entry.proActive === false) return false;
  if (entry.proPeriodEnd) {
    return new Date(entry.proPeriodEnd) > new Date();
  }
  return true;
}

export async function getIpEntry(
  ip: string,
  ctx?: IpAccessContext,
): Promise<IpEntry | null> {
  if (await hasAdminAccess(ip, ctx?.request)) {
    const adminEntry = await getAdminIpEntry(ip);
    return adminEntry ?? buildAdminProEntry();
  }

  const devEntry = await getDevIpEntry(ip);
  if (devEntry && isDevProEntryActive(devEntry)) {
    return devEntry;
  }

  const rows = await listGenerationsByIp(ip);
  if (rows.length === 0) return null;

  const oldest = rows[rows.length - 1];
  const paid = getActivePaidGeneration(rows);

  if (paid?.plan === "pro") {
    let meta = getProMetaFromRow(paid);
    if (meta?.subscriptionId) {
      meta = await syncProSubscription(paid.id, meta);
    }

    return {
      plan: "pro",
      firstGenerationAt: oldest.created_at,
      proSubscriptionId: meta?.subscriptionId,
      proActive: meta ? isProActive(meta) : true,
      proCancelledAt: meta?.proCancelledAt ?? null,
      proPeriodEnd: meta?.proPeriodEnd,
    };
  }

  if (paid?.plan === "oneshot") {
    return {
      plan: "oneshot",
      firstGenerationAt: oldest.created_at,
      oneShotPaidAt: paid.created_at,
    };
  }

  if (hasUsedFreeGeneration(rows)) {
    return {
      plan: "free",
      firstGenerationAt: oldest.created_at,
    };
  }

  return null;
}

export async function canGenerate(
  ip: string,
  ctx?: IpAccessContext,
): Promise<boolean> {
  if (await hasAdminAccess(ip, ctx?.request)) {
    return true;
  }

  const devEntry = await getDevIpEntry(ip);
  if (devEntry && isDevProEntryActive(devEntry)) {
    return true;
  }

  const rows = await listGenerationsByIp(ip);
  if (rows.length === 0) return true;

  const paid = getActivePaidGeneration(rows);
  if (paid?.plan === "pro") {
    const meta = getProMetaFromRow(paid);
    if (meta && !isProActive(meta)) return false;
    return true;
  }
  if (paid?.plan === "oneshot") return true;

  return !hasUsedFreeGeneration(rows);
}

export async function canDownloadPdf(
  ip: string,
  ctx?: IpAccessContext,
): Promise<boolean> {
  if (await hasAdminAccess(ip, ctx?.request)) {
    return true;
  }

  const devEntry = await getDevIpEntry(ip);
  if (devEntry && isDevProEntryActive(devEntry)) {
    return true;
  }

  const rows = await listGenerationsByIp(ip);
  const paid = getActivePaidGeneration(rows);
  if (!paid) return false;

  if (paid.plan === "pro") {
    const meta = getProMetaFromRow(paid);
    if (meta && !isProActive(meta)) return false;
  }

  return true;
}

export async function getPlan(
  ip: string,
  ctx?: IpAccessContext,
): Promise<PlanType> {
  if (await hasAdminAccess(ip, ctx?.request)) {
    return "pro";
  }

  const devEntry = await getDevIpEntry(ip);
  if (devEntry && isDevProEntryActive(devEntry)) {
    return "pro";
  }

  const rows = await listGenerationsByIp(ip);
  const paid = getActivePaidGeneration(rows);

  if (paid?.plan === "pro") {
    const meta = getProMetaFromRow(paid);
    if (meta && !isProActive(meta)) return "free";
    return "pro";
  }

  if (paid?.plan === "oneshot") return "oneshot";
  return "free";
}

export async function saveGeneration(
  ip: string,
  plan: PlanType,
  description: string,
  personas: Persona[],
): Promise<void> {
  await insertGeneration({
    ip,
    plan,
    description,
    personas,
    expires_at: plan === "oneshot" ? oneshotExpiresAt() : null,
  });
}

export async function registerIpAfterGeneration(ip: string): Promise<void> {
  const rows = await listGenerationsByIp(ip);
  if (hasUsedFreeGeneration(rows)) return;

  await insertGeneration({
    ip,
    plan: "free",
    description: "",
    personas: [],
    expires_at: null,
  });
}

export async function markIpOneShot(ip: string): Promise<void> {
  await insertGeneration({
    ip,
    plan: "oneshot",
    description: "",
    personas: [],
    expires_at: oneshotExpiresAt(),
  });
}

export async function markIpPro(
  ip: string,
  subscriptionId: string,
): Promise<void> {
  await insertGeneration({
    ip,
    plan: "pro",
    description: "",
    personas: buildProPersonasPayload({
      subscriptionId,
      proActive: true,
      proCancelledAt: null,
    }),
    expires_at: null,
  });
}

export async function clearGenerations(): Promise<void> {
  await deleteAllGenerations();
}

/** @deprecated use markIpOneShot */
export async function markIpPaid(ip: string): Promise<void> {
  return markIpOneShot(ip);
}
