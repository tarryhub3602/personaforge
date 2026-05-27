const DEFAULT_APP_URL = "http://localhost:3000";

export function getAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_APP_URL;
}

export function getStripeSuccessUrl(plan: "oneshot" | "pro"): string {
  const base = `${getAppUrl()}/success?session_id={CHECKOUT_SESSION_ID}`;
  return plan === "pro" ? `${base}&plan=pro` : base;
}

export function getStripeCancelUrl(): string {
  return `${getAppUrl()}/pricing`;
}
