import { promises as fs } from "fs";
import path from "path";
import { clearGenerations } from "@/lib/ip-limit";

const DATA_DIR = path.join(process.cwd(), "data");

/** Fichiers locaux legacy (plus utilisés, conservés pour nettoyage dev) */
const LEGACY_DATA_FILES = [
  "ips.json",
  "checkout-sessions.json",
  "ip-usage.json",
] as const;

export async function resetAllUserData(): Promise<string[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const reset: string[] = [];

  for (const file of LEGACY_DATA_FILES) {
    const filePath = path.join(DATA_DIR, file);
    try {
      await fs.unlink(filePath);
      reset.push(file);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        continue;
      }
      throw error;
    }
  }

  await clearGenerations();
  reset.push("supabase:generations");

  return reset;
}
