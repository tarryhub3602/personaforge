import { PersonaForgeMark } from "@/components/PersonaForgeMark";

interface PersonaForgeLogoProps {
  size?: number;
  variant?: "light" | "dark";
  showTagline?: boolean;
}

export function PersonaForgeLogo({
  size = 48,
  variant = "dark",
  showTagline = true,
}: PersonaForgeLogoProps) {
  const textColor = variant === "light" ? "#ffffff" : "#5b21b6";
  const subColor = variant === "light" ? "#ddd6fe" : "#7c3aed";

  return (
    <div className="flex items-center gap-3">
      <PersonaForgeMark size={size} />
      <div>
        <div
          style={{
            fontSize: size * 0.45,
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          PersonaForge
        </div>
        {showTagline && (
          <div
            style={{
              fontSize: size * 0.2,
              color: subColor,
              fontWeight: 500,
              marginTop: 2,
            }}
          >
            Personas marketing par IA
          </div>
        )}
      </div>
    </div>
  );
}
