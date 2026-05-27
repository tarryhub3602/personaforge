import { NextRequest, NextResponse } from "next/server";
import {
  canDownloadPdf,
  canGenerate,
  getClientIp,
  getIpEntry,
  getPlan,
} from "@/lib/ip-limit";
import type { IpStatusResponse } from "@/types/persona";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const entry = await getIpEntry(ip);
  const plan = await getPlan(ip);

  const response: IpStatusResponse = {
    ip,
    plan,
    canGenerate: await canGenerate(ip),
    canDownloadPdf: await canDownloadPdf(ip),
    hasOneshotHistory: false,
    proHistoryCount: 0,
  };

  return NextResponse.json({
    ...response,
    entry: entry
      ? {
          plan: entry.plan,
          proActive: entry.proActive,
          proCancelledAt: entry.proCancelledAt,
        }
      : null,
  });
}
