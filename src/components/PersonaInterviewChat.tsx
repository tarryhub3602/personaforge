"use client";

import { useEffect, useRef, useState } from "react";
import type { Persona } from "@/types/persona";
import type { InterviewMessage } from "@/lib/persona-interview";
import { getProductDescription } from "@/lib/personas-storage";

interface PersonaInterviewChatProps {
  persona: Persona;
  index: number;
  open: boolean;
  onClose: () => void;
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-fuchsia-500 to-violet-700",
  "from-indigo-500 to-purple-700",
] as const;

const STARTER_QUESTIONS = [
  "Qu'est-ce qui te frustre le plus au quotidien ?",
  "Comment tu choisis un nouvel outil ou service ?",
  "Qu'est-ce qui te ferait dire non à une offre ?",
];

export function PersonaInterviewChat({
  persona,
  index,
  open,
  onClose,
}: PersonaInterviewChatProps) {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const initials = persona.prenom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;

    setMessages([]);
    setInput("");
    setError(null);
    setLoading(false);

    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [open, persona.prenom]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: InterviewMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/persona-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          messages: nextMessages,
          productDescription: getProductDescription(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Impossible d'obtenir une réponse");
      }

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-interview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />

      <div className="relative flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-violet-500/25 bg-zinc-900 shadow-2xl shadow-violet-950/50 sm:h-[min(640px,85dvh)] sm:rounded-2xl">
        <header className="flex shrink-0 items-center gap-3 border-b border-violet-500/15 px-4 py-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[index % 3]} text-sm font-bold text-white`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="persona-interview-title"
              className="truncate text-base font-semibold text-white"
            >
              Interview — {persona.prenom}
            </h2>
            <p className="truncate text-xs text-zinc-400">
              {persona.age} ans · {persona.job}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Fermer le chat"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-950/30 px-4 py-4 text-sm text-zinc-300">
              <p>
                Posez vos questions à {persona.prenom}. Il ou elle répondra en
                restant dans son personnage (frustrations, motivations,
                objections…).
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(q)}
                    className="rounded-lg border border-violet-500/25 bg-zinc-900/80 px-3 py-1.5 text-left text-xs text-violet-200 transition hover:border-violet-500/40 hover:bg-violet-500/10 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white"
                    : "border border-violet-500/20 bg-zinc-950/80 text-zinc-200"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-violet-500/20 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-400">
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse [animation-delay:150ms]">●</span>
                  <span className="animate-pulse [animation-delay:300ms]">●</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="shrink-0 px-4 pb-2 text-xs text-red-400">{error}</p>
        )}

        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-violet-500/15 p-4"
        >
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              rows={2}
              disabled={loading}
              placeholder={`Question pour ${persona.prenom}…`}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-violet-500/20 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 self-end rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
