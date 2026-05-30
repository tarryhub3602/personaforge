"use client";

import { useState } from "react";
import type { Persona } from "@/types/persona";
import { redirectToStripeCheckout } from "@/lib/checkout-client";
import { getProductDescription, loadPersonas, savePersonas } from "@/lib/personas-storage";
import { PersonaInterviewChat } from "./PersonaInterviewChat";

interface PersonaCardProps {
  persona: Persona;
  index: number;
  locked?: boolean;
  canInterview?: boolean;
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-fuchsia-500 to-violet-700",
  "from-indigo-500 to-purple-700",
] as const;

function ListSection({
  title,
  items,
  dotClass,
  labelClass,
}: {
  title: string;
  items: string[];
  dotClass: string;
  labelClass: string;
}) {
  return (
    <div>
      <h4
        className={`mb-2 text-xs font-semibold uppercase tracking-wider ${labelClass}`}
      >
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-300">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PersonaCard({
  persona,
  index,
  locked = false,
  canInterview = false,
}: PersonaCardProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);

  async function handleUnlock() {
    setCheckoutLoading(true);
    try {
      const stored = loadPersonas();
      if (stored) savePersonas(stored);
      await redirectToStripeCheckout({
        plan: "oneshot",
        personas: stored ?? undefined,
        productDescription: getProductDescription(),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Une erreur est survenue");
      setCheckoutLoading(false);
    }
  }

  const initials = persona.prenom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-900/80 backdrop-blur-sm transition-all duration-300 ${
        locked
          ? "select-none"
          : "hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-900/20"
      }`}
    >
      <div className="border-b border-violet-500/10 bg-gradient-to-br from-violet-950/50 to-zinc-900/50 p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[index % 3]} text-lg font-bold text-white shadow-lg`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-semibold text-white">{persona.prenom}</h3>
            <p className="mt-0.5 text-sm text-violet-300">
              {persona.age} ans · {persona.job}
            </p>
            {!locked && (
              <p className="mt-1 text-xs text-zinc-400">
                {persona.revenusApproximatifs}
              </p>
            )}
          </div>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/20">
            #{index + 1}
          </span>
        </div>

        {!locked && (
          <p className="mt-3 text-xs leading-relaxed text-zinc-400">
            <span className="font-medium text-violet-300">Famille :</span>{" "}
            {persona.situationFamiliale}
          </p>
        )}

        <blockquote className="mt-4 border-l-2 border-violet-500/50 pl-4 text-sm italic text-zinc-400">
          « {persona.citation} »
        </blockquote>
      </div>

      <div
        className={`flex flex-1 flex-col gap-5 p-6 transition-all duration-300 ${
          locked ? "blur-md" : ""
        }`}
        aria-hidden={locked}
      >
        {!locked && (
          <>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                Applications quotidiennes
              </h4>
              <ul className="flex flex-wrap gap-2">
                {persona.applicationsQuotidiennes.map((app, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200 ring-1 ring-violet-500/20"
                  >
                    {app}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-zinc-950/50 p-3 text-sm leading-relaxed text-zinc-300 ring-1 ring-violet-500/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Anecdote du quotidien
              </span>
              <p className="mt-2">{persona.anecdoteQuotidienne}</p>
            </div>
          </>
        )}

        <ListSection
          title="Frustrations"
          items={persona.frustrations}
          dotClass="bg-rose-400"
          labelClass="text-rose-400"
        />
        <ListSection
          title="Motivations"
          items={persona.motivations}
          dotClass="bg-emerald-400"
          labelClass="text-emerald-400"
        />
        <ListSection
          title="Objections"
          items={persona.objections}
          dotClass="bg-amber-400"
          labelClass="text-amber-400"
        />

        {canInterview && (
          <button
            type="button"
            onClick={() => setInterviewOpen(true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-200 transition hover:border-violet-500/50 hover:bg-violet-500/20"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Interviewer ce persona
          </button>
        )}
      </div>

      <PersonaInterviewChat
        persona={persona}
        index={index}
        open={interviewOpen}
        onClose={() => setInterviewOpen(false)}
      />

      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-[2px]">
          <div className="mx-6 rounded-2xl border border-violet-500/30 bg-zinc-900/90 p-8 text-center shadow-2xl shadow-violet-900/30">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 ring-1 ring-violet-500/40">
              <svg
                className="h-6 w-6 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="text-sm text-zinc-400">Persona premium</p>
            <button
              type="button"
              disabled={checkoutLoading}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleUnlock}
            >
              {checkoutLoading ? "Redirection…" : "Débloquer — 4€"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
