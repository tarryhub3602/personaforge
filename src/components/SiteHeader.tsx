"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PersonaForgeLogo } from "@/components/PersonaForgeLogo";
import type { PlanType } from "@/types/persona";
import { getPlanLabel, logoutUser } from "@/lib/user-session";

function HistoryIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanType>("free");
  const [ip, setIp] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ip-status")
      .then((r) => r.json())
      .then((data) => {
        setPlan(data.plan ?? "free");
        setIp(data.ip ?? "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logoutUser(ip || undefined);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="relative z-20 border-b border-violet-500/10 bg-zinc-950/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="transition hover:opacity-90">
          <PersonaForgeLogo size={40} variant="light" showTagline={false} />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="hidden text-sm text-zinc-400 transition hover:text-white sm:inline"
          >
            Générateur
          </Link>
          <Link
            href="/pricing"
            className="hidden rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300 ring-1 ring-violet-500/30 transition hover:bg-violet-500/20 hover:text-white sm:inline"
          >
            Tarifs
          </Link>

          <Link
            href="/historique"
            title="Historique"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/20 text-violet-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white"
          >
            <HistoryIcon />
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              title="Profil"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/20 text-violet-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white"
            >
              <ProfileIcon />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-violet-500/20 bg-zinc-900/95 p-3 shadow-xl shadow-violet-950/40 backdrop-blur-md">
                <p className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Plan actif
                </p>
                <p className="mt-1 px-2 text-sm font-semibold text-violet-200">
                  {getPlanLabel(plan)}
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 w-full rounded-lg border border-violet-500/20 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-red-500/30 hover:bg-red-950/30 hover:text-red-300"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
