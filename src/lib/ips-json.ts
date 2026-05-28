import { promises as fs } from "fs";
import path from "path";
import type { IpEntry } from "@/types/persona";

const IPS_FILE = path.join(process.cwd(), "data", "ips.json");

export type IpsStore = Record<string, IpEntry>;

async function readStore(): Promise<IpsStore> {
  try {
    const raw = await fs.readFile(IPS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as IpsStore;
    }
    return {};
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return {};
    }
    throw error;
  }
}

async function writeStore(store: IpsStore): Promise<void> {
  await fs.mkdir(path.dirname(IPS_FILE), { recursive: true });
  await fs.writeFile(IPS_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export function isDevIpsOverrideEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

async function getStoredIpEntry(ip: string): Promise<IpEntry | null> {
  const store = await readStore();
  return store[ip] ?? null;
}

export async function getDevIpEntry(ip: string): Promise<IpEntry | null> {
  if (!isDevIpsOverrideEnabled()) return null;
  const entry = await getStoredIpEntry(ip);
  if (!entry || entry.isAdmin) return null;
  return entry;
}

export async function getAdminIpEntry(ip: string): Promise<IpEntry | null> {
  const entry = await getStoredIpEntry(ip);
  if (!entry?.isAdmin) return null;
  return entry;
}

export async function grantAdminIpAccess(ip: string): Promise<IpEntry> {
  const entry: IpEntry = {
    plan: "pro",
    firstGenerationAt: new Date().toISOString(),
    proSubscriptionId: "admin",
    proActive: true,
    proCancelledAt: null,
    isAdmin: true,
  };

  const store = await readStore();
  store[ip] = entry;
  await writeStore(store);
  return entry;
}

export async function setDevIpPro(ip: string): Promise<IpEntry> {
  const now = new Date().toISOString();
  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const entry: IpEntry = {
    plan: "pro",
    firstGenerationAt: now,
    proSubscriptionId: "dev_local",
    proActive: true,
    proCancelledAt: null,
    proPeriodEnd: periodEnd.toISOString(),
  };

  const store = await readStore();
  store[ip] = entry;
  await writeStore(store);
  return entry;
}
