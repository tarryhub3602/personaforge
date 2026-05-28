import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSecretKey,
  secretsMatch,
  setAdminAccessCookie,
} from "@/lib/admin-access";
import { getClientIp, markIpPro } from "@/lib/ip-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = getAdminSecretKey();
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET_KEY non configurée" },
      { status: 503 },
    );
  }

  const key = request.nextUrl.searchParams.get("key")?.trim() ?? "";
  if (!key || !secretsMatch(key, secret)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const ip = getClientIp(request);
    await markIpPro(ip, "admin:manual");

    const response = NextResponse.json({
      success: true,
      ip,
      message: "Accès admin activé (cookie + enregistrement Supabase)",
    });

    setAdminAccessCookie(response, secret);
    return response;
  } catch (error) {
    console.error("[admin-access]", error);
    const message =
      error instanceof Error ? error.message : "Échec de l'activation admin";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
