import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "../../../../../server/admin/adminAuth";
import { getAdminAiUsage } from "../../../../../server/ai/aiUsageService";

export async function GET(request: NextRequest) {
  await requireAdminSession();

  const { searchParams } = new URL(request.url);
  const usage = await getAdminAiUsage({
    range: searchParams.get("range"),
    provider: searchParams.get("provider"),
    status: searchParams.get("status"),
    userId: searchParams.get("userId"),
    assessmentId: searchParams.get("assessmentId"),
  });

  return NextResponse.json(usage, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
