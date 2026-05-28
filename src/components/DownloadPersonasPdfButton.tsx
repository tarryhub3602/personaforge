"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DownloadPersonasPdfButtonProps {
  disabled?: boolean;
}

const UNSUPPORTED_COLOR_FN_REGEX = /\b(?:oklch|oklab|lab|color)\(/i;

function hasUnsupportedColorFunction(value: string | null | undefined): boolean {
  if (!value) return false;
  return UNSUPPORTED_COLOR_FN_REGEX.test(value);
}

function normalizeColorValue(
  doc: Document,
  cssProp: string,
  rawValue: string,
): string | null {
  const probe = doc.createElement("div");
  probe.style.setProperty(cssProp, rawValue);
  doc.body.appendChild(probe);
  const resolved = getComputedStyle(probe).getPropertyValue(cssProp).trim();
  probe.remove();

  if (!resolved || hasUnsupportedColorFunction(resolved)) return null;
  return resolved;
}

function sanitizeUnsupportedColors(clonedDoc: Document): void {
  const colorProps = [
    "color",
    "background-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
    "fill",
    "stroke",
    "caret-color",
    "column-rule-color",
  ];

  const allElements = clonedDoc.querySelectorAll<HTMLElement | SVGElement>("*");
  for (const el of allElements) {
    const style = getComputedStyle(el);
    for (const prop of colorProps) {
      const value = style.getPropertyValue(prop).trim();
      if (!hasUnsupportedColorFunction(value)) continue;

      const normalized = normalizeColorValue(clonedDoc, prop, value);
      if (normalized) {
        el.style.setProperty(prop, normalized);
      } else {
        el.style.setProperty(prop, prop === "background-color" ? "transparent" : "#ffffff");
      }
    }
  }
}

export function DownloadPersonasPdfButton({
  disabled = false,
}: DownloadPersonasPdfButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    const startedAt = Date.now();

    try {
      const exportNode = document.getElementById("personas-export");
      if (!exportNode) {
        throw new Error("Zone personas introuvable pour l'export PDF");
      }

      const canvas = await html2canvas(exportNode, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#09090b",
        ignoreElements: (element) => {
          const inlineStyle = element.getAttribute("style") ?? "";
          return hasUnsupportedColorFunction(inlineStyle);
        },
        onclone: (clonedDoc) => {
          sanitizeUnsupportedColors(clonedDoc);
        },
      });
      const image = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;

      let remainingHeight = imageHeight;
      let positionY = 0;

      pdf.addImage(image, "PNG", 0, positionY, pageWidth, imageHeight, undefined, "FAST");
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        positionY = remainingHeight - imageHeight;
        pdf.addPage();
        pdf.addImage(image, "PNG", 0, positionY, pageWidth, imageHeight, undefined, "FAST");
        remainingHeight -= pageHeight;
      }

      pdf.save(`personaforge-personas-${Date.now()}.pdf`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const exportNode = document.getElementById("personas-export");
      const diagnostics = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        hasExportNode: Boolean(exportNode),
        exportNodeSize: exportNode
          ? {
              width: exportNode.clientWidth,
              height: exportNode.clientHeight,
              scrollWidth: exportNode.scrollWidth,
              scrollHeight: exportNode.scrollHeight,
            }
          : null,
        userAgent: navigator.userAgent,
        elapsedMs: Date.now() - startedAt,
      };

      console.error("[pdf-download] Échec génération PDF", diagnostics);

      alert(
        `Erreur lors de la génération du PDF: ${error.message}\n\nConsulte la console (F12) pour les détails techniques.`,
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
