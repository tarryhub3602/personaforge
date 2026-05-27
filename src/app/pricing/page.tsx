import Link from "next/link";
import { PricingCards } from "@/components/PricingCards";
import { SiteHeader } from "@/components/SiteHeader";

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[100px]" />
      </div>

      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <h1 className="bg-gradient-to-r from-white via-violet-200 to-purple-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Choisissez votre offre
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Une génération gratuite pour tester, puis passez au One-shot ou au Pro
            selon vos besoins.
          </p>
        </div>

        <PricingCards />

        <p className="mt-10 text-center text-sm text-zinc-500">
          <Link href="/" className="text-violet-400 hover:text-violet-300">
            ← Retour au générateur
          </Link>
        </p>
      </main>
    </div>
  );
}
