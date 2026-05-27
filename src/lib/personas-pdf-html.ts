import type { Persona } from "@/types/persona";
import { buildPersonaForgeMarkSvg } from "@/lib/personaforge-mark";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function listItems(items: string[]): string {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function appTags(items: string[]): string {
  return items
    .map((item) => `<span class="app-tag">${escapeHtml(item)}</span>`)
    .join("");
}

function personaBody(persona: Persona): string {
  return `
    <div class="persona-body">
      <div class="persona-sections">
        <div class="section-block">
          <p class="detail-line">
            <span class="detail-label">Famille</span>
            ${escapeHtml(persona.situationFamiliale)}
          </p>
        </div>

        <div class="section-block">
          <p class="section-title apps">Applications</p>
          <div class="app-tags">${appTags(persona.applicationsQuotidiennes)}</div>
        </div>

        <div class="section-block">
          <p class="detail-line anecdote">
            <span class="detail-label">Anecdote</span>
            ${escapeHtml(persona.anecdoteQuotidienne)}
          </p>
          <blockquote class="citation">« ${escapeHtml(persona.citation)} »</blockquote>
        </div>

        <div class="section-block">
          <p class="section-title frustrations">Frustrations</p>
          <ul>${listItems(persona.frustrations)}</ul>
        </div>

        <div class="section-block">
          <p class="section-title motivations">Motivations</p>
          <ul>${listItems(persona.motivations)}</ul>
        </div>

        <div class="section-block section-block-last">
          <p class="section-title objections">Objections</p>
          <ul class="last-list">${listItems(persona.objections)}</ul>
        </div>
      </div>
    </div>
  `;
}

function pageHeader(generatedAt: string, showDate: boolean): string {
  const dateLine = showDate
    ? `<p class="date">Date de génération : <span class="date-value">${escapeHtml(generatedAt)}</span></p>`
    : "";

  return `
    <header class="page-header">
      <div class="logo-row">
        <div class="logo-mark">${buildPersonaForgeMarkSvg(58)}</div>
        <div>
          <div class="logo-title">PersonaForge</div>
          <div class="logo-sub">Personas marketing par IA</div>
        </div>
      </div>
      ${dateLine}
      <div class="header-separator" aria-hidden="true"></div>
    </header>
  `;
}

function pageFooter(pageNum: number, totalPages: number): string {
  return `
    <footer class="page-footer">
      <div class="footer-premium">
        <div class="footer-left">
          <div class="footer-mark">${buildPersonaForgeMarkSvg(22)}</div>
          <span class="footer-brand">PersonaForge</span>
        </div>
        <span class="footer-url">personaforge.com</span>
      </div>
      <div class="page-number">${pageNum} / ${totalPages}</div>
    </footer>
  `;
}

function personaPage(
  persona: Persona,
  index: number,
  generatedAt: string,
  totalPages: number,
): string {
  const pageNum = index + 1;
  const introTitle =
    index === 0 ? `<h1 class="page-title">Vos 3 personas marketing</h1>` : "";

  return `
    <section class="pdf-page">
      <div class="page-inner">
        ${pageHeader(generatedAt, index === 0)}
        ${introTitle}
        <article class="persona-card">
          <div class="persona-header">
            <div class="persona-header-top">
              <span class="persona-badge">Persona #${index + 1}</span>
            </div>
            <div class="persona-name">${escapeHtml(persona.prenom)}</div>
            <div class="persona-meta">${persona.age} ans · ${escapeHtml(persona.job)}</div>
            <div class="persona-income">${escapeHtml(persona.revenusApproximatifs)}</div>
          </div>
          ${personaBody(persona)}
        </article>
        ${pageFooter(pageNum, totalPages)}
      </div>
    </section>
  `;
}

export function buildPersonasPdfHtml(
  personas: Persona[],
  generatedAt: string,
): string {
  const totalPages = personas.length;
  const pagesHtml = personas
    .map((persona, index) => personaPage(persona, index, generatedAt, totalPages))
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>PersonaForge — Personas</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 100%;
      background: #0d0d12;
    }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      color: #e2e0f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .pdf-page {
      width: 210mm;
      height: 297mm;
      background: #0d0d12;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }

    .pdf-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .page-inner {
      display: flex;
      flex-direction: column;
      height: 297mm;
      padding: 12mm 14mm 10mm;
    }

    .page-header {
      flex-shrink: 0;
      margin-bottom: 10px;
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-mark {
      flex-shrink: 0;
      line-height: 0;
    }

    .logo-mark svg {
      display: block;
    }

    .logo-title {
      font-size: 30px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.03em;
      line-height: 1.05;
    }

    .logo-sub {
      font-size: 11px;
      font-weight: 500;
      color: #6b6882;
      margin-top: 5px;
    }

    .date {
      margin-top: 12px;
      font-size: 11px;
      color: #a78bfa;
      font-weight: 500;
    }

    .date-value {
      color: #a78bfa;
      font-weight: 600;
    }

    .header-separator {
      margin-top: 14px;
      height: 1px;
      background: linear-gradient(
        90deg,
        rgba(167, 139, 250, 0.45) 0%,
        rgba(255, 255, 255, 0.08) 45%,
        rgba(255, 255, 255, 0.04) 100%
      );
    }

    .page-title {
      flex-shrink: 0;
      font-size: 14px;
      font-weight: 600;
      color: #e2e0f0;
      margin-bottom: 10px;
      letter-spacing: -0.01em;
    }

    .persona-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      background: #13131c;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    }

    .persona-header {
      flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
      padding: 16px 18px 14px;
      color: #ffffff;
    }

    .persona-header-top {
      margin-bottom: 6px;
    }

    .persona-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 999px;
      padding: 3px 10px;
    }

    .persona-name {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 3px;
      color: #ffffff;
    }

    .persona-meta {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.92);
      font-weight: 500;
    }

    .persona-income {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.75);
      margin-top: 5px;
    }

    .persona-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 14px 18px 16px;
      background: #13131c;
    }

    .persona-sections {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100%;
      gap: 0;
    }

    .section-block {
      padding: 6px 0 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .section-block-last {
      border-bottom: none;
      padding-bottom: 0;
    }

    .detail-line {
      font-size: 10.5px;
      line-height: 1.55;
      color: #e2e0f0;
    }

    .detail-label {
      display: block;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #a78bfa;
      margin-bottom: 4px;
    }

    .section-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 7px;
    }

    .section-title.apps { color: #a78bfa; }
    .section-title.frustrations { color: #fb923c; }
    .section-title.motivations { color: #34d399; }
    .section-title.objections { color: #f87171; }

    .app-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .app-tag {
      display: inline-block;
      font-size: 9.5px;
      font-weight: 500;
      color: #ddd6fe;
      background: rgba(124, 58, 237, 0.3);
      border: 1px solid rgba(167, 139, 250, 0.55);
      border-radius: 8px;
      padding: 4px 10px;
    }

    .citation {
      margin: 10px 0 0 0;
      padding: 10px 12px;
      background: rgba(124, 58, 237, 0.12);
      border-left: 3px solid #a78bfa;
      border-radius: 0 8px 8px 0;
      font-style: italic;
      font-size: 10.5px;
      color: #e2e0f0;
      line-height: 1.5;
    }

    ul {
      margin: 0 0 0 15px;
      font-size: 10.5px;
      color: #e2e0f0;
      line-height: 1.55;
    }

    ul li {
      margin-bottom: 3px;
      padding-left: 2px;
    }

    ul li::marker {
      color: #6b6882;
    }

    ul.last-list {
      margin-bottom: 0;
    }

    .page-footer {
      flex-shrink: 0;
      margin-top: 8px;
    }

    .footer-premium {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer-mark {
      line-height: 0;
      flex-shrink: 0;
    }

    .footer-mark svg {
      display: block;
    }

    .footer-brand {
      font-size: 10px;
      font-weight: 600;
      color: #a78bfa;
      letter-spacing: -0.01em;
    }

    .footer-url {
      font-size: 9px;
      font-weight: 500;
      color: #6b6882;
      letter-spacing: 0.02em;
    }

    .page-number {
      margin-top: 4px;
      text-align: right;
      font-size: 9px;
      font-weight: 500;
      color: #6b6882;
      letter-spacing: 0.04em;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}
