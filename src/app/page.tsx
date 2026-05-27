import { Suspense } from "react";
import { PersonaGenerator } from "@/components/PersonaGenerator";

function HomeFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07050f] text-zinc-400">
      Chargement…
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <PersonaGenerator />
    </Suspense>
  );
}
