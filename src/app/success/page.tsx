import { Suspense } from "react";
import { SuccessContent } from "@/components/SuccessContent";

export default function SuccessPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[100px]" />
      </div>
      <Suspense
        fallback={
          <p className="relative z-10 py-24 text-center text-zinc-400">
            Chargement…
          </p>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
