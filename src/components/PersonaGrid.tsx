import type { Persona } from "@/types/persona";
import { PersonaCard } from "./PersonaCard";

interface PersonaGridProps {
  personas: Persona[];
  unlocked?: boolean;
  subtitle?: string;
}

export function PersonaGrid({
  personas,
  unlocked = false,
  subtitle,
}: PersonaGridProps) {
  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold text-white">
        Vos 3 personas
      </h2>
      {subtitle && (
        <p className="mb-10 text-center text-sm text-zinc-500">{subtitle}</p>
      )}
      {!subtitle && <div className="mb-10" />}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {personas.map((persona, index) => (
          <PersonaCard
            key={`${persona.prenom}-${index}`}
            persona={persona}
            index={index}
            locked={!unlocked && index > 0}
          />
        ))}
      </div>
    </div>
  );
}
