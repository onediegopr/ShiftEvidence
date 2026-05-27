import { NextResponse } from "next/server";
import { requireAdminSession } from "../../../../../server/admin/adminAuth";
import { getAiRuntimeStatus } from "../../../../../server/ai/aiRuntimeStatus";

export async function GET() {
  await requireAdminSession();

  return NextResponse.json(getAiRuntimeStatus(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
