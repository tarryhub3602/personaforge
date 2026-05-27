import type { Persona } from "@/types/persona";
import {
  getProductDescription,
  loadPersonas,
} from "@/lib/personas-storage";
import { saveSessionPersonas } from "@/lib/session-storage";

export type CheckoutPlan = "oneshot" | "pro";

export type CheckoutPayload = {
  plan?: CheckoutPlan;
  personas?: Persona[];
  productDescription?: string;
};

export async function redirectToStripeCheckout(
  payload: CheckoutPlan | CheckoutPayload = "oneshot",
): Promise<void> {
  const options: CheckoutPayload =
    typeof payload === "string" ? { plan: payload } : payload;

  const plan = options.plan ?? "oneshot";
  const personas = options.personas ?? loadPersonas() ?? undefined;
  const productDescription =
    options.productDescription?.trim() ||
    getProductDescription().trim() ||
    "";

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan,
      personas,
      productDescription,
    }),
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Impossible de démarrer le paiement");
  }

  if (!data.url || !data.sessionId) {
    throw new Error("URL de paiement introuvable");
  }

  if (personas && personas.length === 3) {
    saveSessionPersonas(data.sessionId, personas, productDescription);
  }

  window.location.href = data.url;
}
