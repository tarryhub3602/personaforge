"use client";

import { useState } from "react";
import type { Persona } from "@/types/persona";

interface DownloadPersonasPdfButtonProps {
  personas: Persona[];
  disabled?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderList(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function buildPrintablePersonasHtml(personas: Persona[]): string {
  const cards = personas
    .map(
      (persona, index) => `
      <article class="persona-card">
        <header>
          <p class="badge">Persona #${index + 1}</p>
          <h2>${escapeHtml(persona.prenom)}</h2>
          <p class="meta">${persona.age} ans - ${escapeHtml(persona.job)}</p>
          <p class="meta">${escapeHtml(persona.revenusApproximatifs)}</p>
          <p class="meta"><strong>Famille :</strong> ${escapeHtml(persona.situationFamiliale)}</p>
        </header>
        <section><h3>Citation</h3><p>"${escapeHtml(persona.citation)}"</p></section>
        <section><h3>Applications quotidiennes</h3>${renderList(persona.applicationsQuotidiennes)}</section>
        <section><h3>Anecdote</h3><p>${escapeHtml(persona.anecdoteQuotidienne)}</p></section>
        <section><h3>Frustrations</h3>${renderList(persona.frustrations)}</section>
        <section><h3>Motivations</h3>${renderList(persona.motivations)}</section>
        <section><h3>Objections</h3>${renderList(persona.objections)}</section>
      </article>`,
    )
    .join("");

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PersonaForge - Personas</title>
    <style>
      :root {
        --bg: #ffffff;
        --text: #111827;
        --muted: #4b5563;
        --border: #e5e7eb;
        --accent: #6d28d9;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        font-family: Inter, Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      h1 {
        margin: 0 0 16px;
        color: var(--accent);
        font-size: 24px;
      }
      .persona-card {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        break-inside: avoid;
      }
      .badge {
        margin: 0 0 8px;
        color: var(--accent);
        font-weight: 700;
      }
      h2 { margin: 0 0 6px; font-size: 20px; }
      h3 {
        margin: 12px 0 6px;
        font-size: 14px;
        text-transform: uppercase;
        color: var(--accent);
      }
      p { margin: 0 0 8px; line-height: 1.45; }
      .meta { color: var(--muted); }
      ul { margin: 0; padding-left: 18px; }
      li { margin: 0 0 4px; line-height: 1.45; }
      @media print {
        @page { size: A4; margin: 12mm; }
        body { padding: 0; }
        .persona-card { page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <h1>Personas PersonaForge</h1>
    ${cards}
  </body>
</html>`;
}

export function DownloadPersonasPdfButton({
  personas,
  disabled = false,
}: DownloadPersonasPdfButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      if (!Array.isArray(personas) || personas.length !== 3) {
        throw new Error("Les personas à imprimer sont introuvables.");
      }

      const printableHtml = buildPrintablePersonasHtml(personas);
      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const iframeWindow = iframe.contentWindow;
      if (!iframeWindow) {
        iframe.remove();
        throw new Error("Impossible d'initialiser la zone d'impression.");
      }

      iframeWindow.document.open();
      iframeWindow.document.write(printableHtml);
      iframeWindow.document.close();

      const cleanup = () => {
        window.setTimeout(() => iframe.remove(), 500);
      };

      iframeWindow.addEventListener("afterprint", cleanup, { once: true });

      window.setTimeout(() => {
        iframeWindow.focus();
        iframeWindow.print();
      }, 150);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[pdf-download] Échec impression PDF", error);

      alert(
        `Erreur lors de la génération du PDF: ${error.message}`,
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading || disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {downloading ? "Génération du PDF…" : "Télécharger mes personas en PDF"}
    </button>
  );
}
