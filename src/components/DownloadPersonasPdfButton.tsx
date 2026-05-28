"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DownloadPersonasPdfButtonProps {
  disabled?: boolean;
}

export function DownloadPersonasPdfButton({
  disabled = false,
}: DownloadPersonasPdfButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);

    try {
      const exportNode = document.getElementById("personas-export");
      if (!exportNode) {
        throw new Error("Zone personas introuvable pour l'export PDF");
      }

      const canvas = await html2canvas(exportNode, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#09090b",
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
      alert(
        err instanceof Error
          ? err.message
          : "Impossible de générer le PDF. Réessayez.",
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
