export const PERSONAFORGE_MARK_COLOR = "#7c3aed";
export const PERSONAFORGE_MARK_VIEWBOX = 48;
export const PERSONAFORGE_MARK_RADIUS = 12;
export const PERSONAFORGE_MARK_FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function buildPersonaForgeMarkSvg(size?: number): string {
  const dimensions =
    size !== undefined ? ` width="${size}" height="${size}"` : "";

  return `<svg${dimensions} viewBox="0 0 ${PERSONAFORGE_MARK_VIEWBOX} ${PERSONAFORGE_MARK_VIEWBOX}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PersonaForge"><rect width="${PERSONAFORGE_MARK_VIEWBOX}" height="${PERSONAFORGE_MARK_VIEWBOX}" rx="${PERSONAFORGE_MARK_RADIUS}" fill="${PERSONAFORGE_MARK_COLOR}"/><text x="24" y="24.5" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="${PERSONAFORGE_MARK_FONT}" font-weight="700" font-size="17" letter-spacing="-0.02em">PF</text></svg>`;
}
