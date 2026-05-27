"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import type { HistoryListItem } from "@/lib/history-storage";
import { getUnifiedHistory } from "@/lib/history-storage";
import { applyPersonasToSession } from "@/lib/restore-personas";
import { SiteHeader } from "./SiteHeader";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoriqueContent() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ip-status");
      const data = await res.json();
      const userIp = data.ip as string;
      setEntries(getUnifiedHistory(userIp));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function handleRevoir(entry: HistoryListItem) {
    applyPersonasToSession(
      entry.personas,
      entry.productDescription,
      entry.createdAt,
    );
    router.push("/");
  }

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">Historique</h1>
        <p className="mt-2 text-zinc-400">
          Toutes vos générations de personas sauvegardées sur cet appareil.
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-500">Chargement…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-violet-500/20 bg-zinc-900/50 p-10 text-center">
          <p className="text-zinc-400">Aucune génération enregistrée pour le moment.</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Générer mes personas
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-violet-500/20 bg-zinc-900/60 p-5 backdrop-blur-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-violet-300">
                      {formatDate(entry.createdAt)}
                    </span>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400 ring-1 ring-violet-500/20">
                      {entry.plan === "pro" ? "Pro" : "One-shot"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-300">
                    {entry.productDescription}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    3 personas · {entry.personas.map((p) => p.prenom).join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoir(entry)}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500"
                >
                  Revoir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function HistoriquePageClient() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[100px]" />
      </div>
      <SiteHeader />
      <Suspense fallback={<p className="relative z-10 p-12 text-zinc-500">Chargement…</p>}>
        <HistoriqueContent />
      </Suspense>
    </div>
  );
}
