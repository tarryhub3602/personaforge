import { NextResponse } from "next/server";
import { resetAllUserData } from "@/lib/reset-user-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowedEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function POST() {
  if (process.env.NODE_ENV === "production" || !isAllowedEnvironment()) {
    return NextResponse.json(
      { error: "Route désactivée en production" },
      { status: 403 },
    );
  }

  try {
    const deletedFiles = await resetAllUserData();

    return NextResponse.json({
      success: true,
      message: "Données utilisateurs réinitialisées",
      deletedFiles,
    });
  } catch (error) {
    console.error("[reset-users]", error);
    const message =
      error instanceof Error ? error.message : "Échec de la réinitialisation";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
