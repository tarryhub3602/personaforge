import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/ip-limit";
import { setDevIpPro } from "@/lib/ips-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowedEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

async function handleSetPro(request: NextRequest) {
  if (!isAllowedEnvironment()) {
    return NextResponse.json(
      { error: "Route désactivée en production" },
      { status: 403 },
    );
  }

  try {
    const ip = getClientIp(request);
    const entry = await setDevIpPro(ip);

    return NextResponse.json({
      success: true,
      ip,
      entry,
      message: `IP ${ip} marquée comme pro dans data/ips.json`,
    });
  } catch (error) {
    console.error("[set-pro-local]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Échec du marquage pro local";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleSetPro(request);
}

export async function GET(request: NextRequest) {
  return handleSetPro(request);
}
