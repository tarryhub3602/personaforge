"use client";

import type { Persona } from "@/types/persona";
import {
  markUnlocked,
  savePersonas,
  saveProductDescription,
  setGeneratedAt,
} from "@/lib/personas-storage";

export function applyPersonasToSession(
  personas: Persona[],
  productDescription: string,
  createdAt?: string,
): void {
  savePersonas(personas);
  saveProductDescription(productDescription);
  if (createdAt) setGeneratedAt(createdAt);
  markUnlocked();
}

export function scrollToPersonasSection(): void {
  requestAnimationFrame(() => {
    document.getElementById("personas-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}
