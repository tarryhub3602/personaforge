"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Persona } from "@/types/persona";
import {
  addProHistoryEntry,
  initProHistory,
  saveOneShotHistory,
} from "@/lib/history-storage";
import {
  markUnlocked,
  savePersonas,
  saveProductDescription,
} from "@/lib/personas-storage";
import { loadSessionPersonas } from "@/lib/session-storage";
import { DownloadPersonasPdfButton } from "./DownloadPersonasPdfButton";
import { PersonaGrid } from "./PersonaGrid";
import { SiteHeader } from "./SiteHeader";

type PageStatus = "loading" | "success" | "pro_welcome" | "error";

export function SuccessContent() {
  const searchParams = useSearchParams();
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [status, setStatus] = useState<PageStatus>("loading");
  const [plan, setPlan] = useState<"oneshot" | "pro">("oneshot");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAfterPayment() {
      const sessionId = searchParams.get("session_id");
      const planParam = searchParams.get("plan");

      if (!sessionId) {
        setErrorMessage("Paramètre session_id absent de l'URL.");
        setStatus("error");
        return;
      }

      try {
        const verifyRes = await fetch(
          `/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`,
        );
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.paid) {
          setErrorMessage(
            verifyData.error ?? "Le paiement n'a pas pu être confirmé.",
          );
          setStatus("error");
          return;
        }

        const paidPlan =
          verifyData.plan === "pro" || planParam === "pro" ? "pro" : "oneshot";
        setPlan(paidPlan);

        let resolvedPersonas: Persona[] | null = null;
        let productDescription = verifyData.productDescription ?? "";

        const fromLocalStorage = loadSessionPersonas(sessionId);
        if (fromLocalStorage?.personas?.length === 3) {
          resolvedPersonas = fromLocalStorage.personas;
          productDescription =
            fromLocalStorage.productDescription || productDescription;
        }

        if (!resolvedPersonas) {
          const recoverRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const recoverData = await recoverRes.json();

          if (!recoverRes.ok || !recoverData.personas) {
            if (paidPlan === "pro") {
              setStatus("pro_welcome");
              return;
            }
            setErrorMessage(
              recoverData.error ??
                "Impossible de récupérer ou régénérer vos personas.",
            );
            setStatus("error");
            return;
          }

          resolvedPersonas = recoverData.personas as Persona[];
          productDescription =
            recoverData.productDescription || productDescription;
        }

        if (!resolvedPersonas || resolvedPersonas.length !== 3) {
          setErrorMessage("Impossible de récupérer vos personas.");
          setStatus("error");
          return;
        }

        const ip = verifyData.ip as string;

        savePersonas(resolvedPersonas);
        saveProductDescription(productDescription);
        markUnlocked();

        if (paidPlan === "pro") {
          initProHistory(ip, true);
          addProHistoryEntry(ip, resolvedPersonas, productDescription);
        } else {
          saveOneShotHistory(ip, resolvedPersonas, productDescription);
        }

        setPersonas(resolvedPersonas);
        setStatus("success");
      } catch {
        setErrorMessage("Une erreur est survenue lors du chargement.");
        setStatus("error");
      }
    }

    loadAfterPayment();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <>
        <SiteHeader />
        <div className="relative z-10 flex flex-col items-center justify-center py-24">
          <p className="text-zinc-400">Vérification du paiement…</p>
        </div>
      </>
    );
  }

  if (status === "pro_welcome") {
    return (
      <>
        <SiteHeader />
        <div className="relative z-10 mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-white">Abonnement Pro activé</h1>
          <p className="mt-3 text-zinc-400">
            Votre paiement est confirmé. Générez vos personas depuis l&apos;accueil.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Commencer à générer
          </Link>
        </div>
      </>
    );
  }

  if (status === "error" || !personas) {
    return (
      <>
        <SiteHeader />
        <div className="relative z-10 mx-auto max-w-md px-4 py-24">
          <div className="rounded-2xl border border-violet-500/30 bg-zinc-900/80 p-10 text-center">
            <h1 className="text-2xl font-bold text-white">Session introuvable</h1>
            <p className="mt-3 text-zinc-400">
              {errorMessage ?? "Impossible de récupérer vos personas."}
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white"
            >
              Retour à PersonaForge
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-white">Paiement réussi</h1>
          <p className="mt-3 text-zinc-400">
            {plan === "pro"
              ? "Bienvenue dans PersonaForge Pro — générations et PDF illimités."
              : "Vos 3 personas sont débloqués et sauvegardés pendant 3 mois."}
          </p>
        </div>

        <div id="personas-export">
          <PersonaGrid
            personas={personas}
            unlocked
            subtitle={
              plan === "pro"
                ? "Abonnement Pro actif"
                : "Historique One-shot — conservé 3 mois"
            }
          />
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <DownloadPersonasPdfButton />
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-violet-500/30 bg-zinc-900/60 px-6 py-3 text-sm font-medium text-violet-300 hover:text-white"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </>
  );
}
