"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { IpStatusResponse, Persona, PlanType } from "@/types/persona";
import {
  addProHistoryEntry,
  findOneShotHistoryAny,
  getHistoryEntryById,
  getOneShotHistory,
  hasOneShotHistory,
  initProHistory,
} from "@/lib/history-storage";
import {
  applyPersonasToSession,
  scrollToPersonasSection,
} from "@/lib/restore-personas";
import {
  clearGeneratedAt,
  clearUnlocked,
  isUnlocked,
  loadPersonas,
  markUnlocked,
  savePersonas,
  saveProductDescription,
} from "@/lib/personas-storage";
import { redirectToStripeCheckout } from "@/lib/checkout-client";
import { DownloadPersonasPdfButton } from "./DownloadPersonasPdfButton";
import { PersonaGrid } from "./PersonaGrid";
import { SiteHeader } from "./SiteHeader";

export function PersonaGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [description, setDescription] = useState("");
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [ipStatus, setIpStatus] = useState<IpStatusResponse | null>(null);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);

  const plan: PlanType = ipStatus?.plan ?? "free";
  const unlocked =
    plan === "oneshot" || plan === "pro" || isUnlocked();

  const canViewSavedPersonas = hasOneShotHistory(ipStatus?.ip);

  const loadIpStatus = useCallback(async () => {
    const res = await fetch("/api/ip-status");
    return (await res.json()) as IpStatusResponse;
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const data = await loadIpStatus();
        setIpStatus(data);

        const entryId = searchParams.get("entry");
        if (entryId) {
          const entry = getHistoryEntryById(data.ip, entryId);
          if (entry) {
            applyPersonasToSession(
              entry.personas,
              entry.productDescription,
              entry.createdAt,
            );
            setPersonas(entry.personas);
            setDescription(entry.productDescription);
            setShowRestoredBanner(true);
            router.replace("/", { scroll: false });
            scrollToPersonasSection();
            setHistoryReady(true);
            return;
          }
        }

        const sessionPersonas = loadPersonas();
        const sessionDescription =
          typeof window !== "undefined"
            ? sessionStorage.getItem("personaforge_description") ?? ""
            : "";

        if (sessionPersonas) {
          setPersonas(sessionPersonas);
          if (sessionDescription) setDescription(sessionDescription);
          if (isUnlocked() || data.plan === "oneshot" || data.plan === "pro") {
            markUnlocked();
          }
        }
      } catch {
        const stored = loadPersonas();
        if (stored) setPersonas(stored);
      } finally {
        setHistoryReady(true);
      }
    }

    init();
  }, [loadIpStatus, router, searchParams]);

  useEffect(() => {
    if (personas) savePersonas(personas);
  }, [personas]);

  function handleViewPersonas() {
    const history =
      (ipStatus?.ip ? getOneShotHistory(ipStatus.ip) : null) ??
      findOneShotHistoryAny();

    if (!history) return;

    applyPersonasToSession(
      history.personas,
      history.productDescription,
      history.savedAt,
    );
    setPersonas(history.personas);
    setDescription(history.productDescription);
    markUnlocked();
    setShowRestoredBanner(true);
    scrollToPersonasSection();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLimitMessage(null);
    const previousPersonas = loadPersonas();
    clearUnlocked();
    clearGeneratedAt();
    setShowRestoredBanner(false);
    setLoading(true);
    saveProductDescription(description);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productDescription: description }),
      });

      const data = await res.json();

      if (res.status === 403 && data.limitReached) {
        if (previousPersonas) setPersonas(previousPersonas);
        setLimitMessage(
          data.error ??
            "Vous avez utilisé votre génération gratuite — débloquez vos 3 personas pour 9€",
        );
        setLoading(false);
        const status = await loadIpStatus();
        setIpStatus(status);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Erreur lors de la génération");
      }

      const generated = data.personas as Persona[];
      setPersonas(generated);

      const status = await loadIpStatus();
      setIpStatus(status);

      if (status.plan === "pro") {
        initProHistory(status.ip, true);
        addProHistoryEntry(status.ip, generated, description);
        markUnlocked();
      } else if (status.plan === "oneshot") {
        markUnlocked();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayToUnlock() {
    setCheckoutLoading(true);
    setError(null);
    try {
      await redirectToStripeCheckout({
        plan: "oneshot",
        personas: personas ?? undefined,
        productDescription: description,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de démarrer le paiement",
      );
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[100px]" />
      </div>

      <SiteHeader />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            Propulsé par gpt-5.4-mini
            {plan === "pro" && (
              <span className="ml-1 rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                Pro actif
              </span>
            )}
          </div>
          <h1 className="bg-gradient-to-r from-white via-violet-200 to-purple-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            PersonaForge
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Décrivez votre produit et obtenez 3 personas marketing détaillés et
            concrets en quelques secondes.
          </p>
        </header>

        {historyReady && canViewSavedPersonas && !personas && (
          <div className="mx-auto mb-6 max-w-2xl rounded-xl border border-violet-500/30 bg-violet-950/40 px-4 py-4 text-center">
            <p className="text-sm text-violet-200">
              Vous avez des personas sauvegardés (valables 3 mois).
            </p>
            <button
              type="button"
              onClick={handleViewPersonas}
              className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Voir mes personas
            </button>
          </div>
        )}

        {historyReady && canViewSavedPersonas && personas && (
          <div className="mx-auto mb-6 max-w-2xl text-center">
            <button
              type="button"
              onClick={handleViewPersonas}
              className="text-sm font-medium text-violet-400 underline-offset-2 hover:text-violet-300 hover:underline"
            >
              Voir mes personas sauvegardés
            </button>
          </div>
        )}

        {showRestoredBanner && (
          <div className="mx-auto mb-6 max-w-2xl rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-center text-sm text-emerald-300">
            Vos personas ont été restaurés depuis votre historique.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl rounded-2xl border border-violet-500/20 bg-zinc-900/60 p-6 shadow-xl shadow-violet-950/30 backdrop-blur-sm"
        >
          <label
            htmlFor="product"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Décrivez votre produit ou service
          </label>
          <textarea
            id="product"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex : Une application SaaS de gestion de projets pour les équipes marketing remote..."
            rows={5}
            required
            minLength={20}
            disabled={loading}
            className="w-full resize-none rounded-xl border border-violet-500/20 bg-zinc-950/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-zinc-500">Minimum 20 caractères</p>

          {limitMessage && (
            <div className="mt-4 rounded-lg border border-violet-500/40 bg-violet-950/50 px-4 py-4 text-sm text-violet-200">
              <p>{limitMessage}</p>
              <button
                type="button"
                onClick={handlePayToUnlock}
                disabled={checkoutLoading}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {checkoutLoading ? "Redirection…" : "Débloquer — 9€"}
              </button>
              <Link
                href="/pricing"
                className="mt-3 block text-center text-xs text-violet-400 hover:text-violet-300"
              >
                Voir toutes les offres →
              </Link>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || description.trim().length < 20}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Génération en cours…" : "Générer mes personas"}
          </button>
        </form>

        {personas && (
          <div id="personas-section" className="mt-16 scroll-mt-24">
            <div id="personas-export">
              <PersonaGrid
                personas={personas}
                unlocked={unlocked}
                subtitle={
                  unlocked
                    ? plan === "pro"
                      ? "Plan Pro — personas complets"
                      : "Tous vos personas sont débloqués"
                    : "Le premier persona est gratuit · Débloquez les 2 autres pour 9€"
                }
              />
            </div>

            {unlocked && ipStatus?.canDownloadPdf && (
              <div className="mt-8 flex justify-center">
                <DownloadPersonasPdfButton />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
