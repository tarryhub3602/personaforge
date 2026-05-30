"use client";

import { useState } from "react";
import { redirectToStripeCheckout } from "@/lib/checkout-client";

export function PricingCards() {
  const [loadingPlan, setLoadingPlan] = useState<"oneshot" | "pro" | null>(null);

  async function handleCheckout(plan: "oneshot" | "pro") {
    setLoadingPlan(plan);
    try {
      await redirectToStripeCheckout(plan);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur de paiement");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col rounded-2xl border border-violet-500/20 bg-zinc-900/60 p-8 shadow-xl shadow-violet-950/20 backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-400">
          One-shot
        </p>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">4€</span>
          <span className="text-zinc-500">paiement unique</span>
        </div>
        <ul className="mt-6 flex-1 space-y-3 text-sm text-zinc-300">
          <li>✓ 3 personas complets débloqués</li>
          <li>✓ Export PDF</li>
          <li>✓ Historique conservé 3 mois</li>
          <li>✓ Bouton « Retrouver mes personas »</li>
        </ul>
        <button
          type="button"
          onClick={() => handleCheckout("oneshot")}
          disabled={loadingPlan !== null}
          className="mt-8 w-full rounded-xl border border-violet-500/40 bg-violet-500/10 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-50"
        >
          {loadingPlan === "oneshot" ? "Redirection…" : "Choisir One-shot — 4€"}
        </button>
      </div>

      <div className="relative flex flex-col rounded-2xl border-2 border-violet-500/50 bg-gradient-to-b from-violet-950/40 to-zinc-900/60 p-8 shadow-2xl shadow-violet-900/30 backdrop-blur-sm">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1 text-xs font-semibold text-white">
          Recommandé
        </span>
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-300">
          Pro
        </p>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">9€</span>
          <span className="text-zinc-500">/ mois</span>
        </div>
        <ul className="mt-6 flex-1 space-y-3 text-sm text-zinc-300">
          <li>✓ Générations illimitées</li>
          <li>✓ PDF illimité</li>
          <li>✓ Historique complet tant que l&apos;abo est actif</li>
          <li>✓ 30 jours d&apos;accès historique après annulation</li>
        </ul>
        <button
          type="button"
          onClick={() => handleCheckout("pro")}
          disabled={loadingPlan !== null}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
        >
          {loadingPlan === "pro" ? "Redirection…" : "S'abonner Pro — 9€/mois"}
        </button>
      </div>
    </div>
  );
}
