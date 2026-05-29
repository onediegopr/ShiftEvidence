import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "../../../../../server/admin/adminAuth";
import { getAdminPagination } from "../../../../../server/admin/adminPagination";
import { getAdminAiUsage } from "../../../../../server/ai/aiUsageService";

export async function GET(request: NextRequest) {
  await requireAdminSession();

  const { searchParams } = new URL(request.url);
  const pagination = getAdminPagination(searchParams);
  const usage = await getAdminAiUsage({
    range: searchParams.get("range"),
    provider: searchParams.get("provider"),
    status: searchParams.get("status"),
    userId: searchParams.get("userId"),
    assessmentId: searchParams.get("assessmentId"),
    limit: pagination.limit,
    page: pagination.page,
  });

  return NextResponse.json(usage, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
