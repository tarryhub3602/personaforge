import {
  PERSONAFORGE_MARK_COLOR,
  PERSONAFORGE_MARK_FONT,
  PERSONAFORGE_MARK_RADIUS,
  PERSONAFORGE_MARK_VIEWBOX,
} from "@/lib/personaforge-mark";

interface PersonaForgeMarkProps {
  size?: number;
  className?: string;
  title?: string;
}

export function PersonaForgeMark({
  size = 48,
  className,
  title = "PersonaForge",
}: PersonaForgeMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${PERSONAFORGE_MARK_VIEWBOX} ${PERSONAFORGE_MARK_VIEWBOX}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <rect
        width={PERSONAFORGE_MARK_VIEWBOX}
        height={PERSONAFORGE_MARK_VIEWBOX}
        rx={PERSONAFORGE_MARK_RADIUS}
        fill={PERSONAFORGE_MARK_COLOR}
      />
      <text
        x="24"
        y="24.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontFamily={PERSONAFORGE_MARK_FONT}
        fontWeight={700}
        fontSize="17"
        letterSpacing="-0.02em"
      >
        PF
      </text>
    </svg>
  );
}
