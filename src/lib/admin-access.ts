import { timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { IpEntry } from "@/types/persona";
import { getAdminIpEntry } from "@/lib/ips-json";

export const ADMIN_COOKIE_NAME = "pf_admin_access";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function getAdminSecretKey(): string | null {
  const key = process.env.ADMIN_SECRET_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function secretsMatch(provided: string, expected: string): boolean {
  const bufProvided = Buffer.from(provided);
  const bufExpected = Buffer.from(expected);

  if (bufProvided.length !== bufExpected.length) {
    timingSafeEqual(bufProvided, bufProvided);
    return false;
  }

  return timingSafeEqual(bufProvided, bufExpected);
}

export function hasValidAdminCookie(request: NextRequest): boolean {
  const secret = getAdminSecretKey();
  if (!secret) return false;

  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  return secretsMatch(cookieValue, secret);
}

export async function isIpAdminGranted(ip: string): Promise<boolean> {
  if (!getAdminSecretKey()) return false;
  const entry = await getAdminIpEntry(ip);
  return entry?.isAdmin === true && entry.plan === "pro";
}

export async function hasAdminAccess(
  ip: string,
  request?: NextRequest,
): Promise<boolean> {
  if (!getAdminSecretKey()) return false;
  if (request && hasValidAdminCookie(request)) return true;
  return isIpAdminGranted(ip);
}

export function buildAdminProEntry(): IpEntry {
  return {
    plan: "pro",
    firstGenerationAt: new Date().toISOString(),
    proSubscriptionId: "admin",
    proActive: true,
    proCancelledAt: null,
    isAdmin: true,
  };
}

export function setAdminAccessCookie(
  response: NextResponse,
  secret: string,
): void {
  response.cookies.set(ADMIN_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}
