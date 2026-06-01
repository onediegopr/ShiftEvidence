import { NextResponse } from "next/server";
import { requireAdminSession } from "../../../../../../server/admin/adminAuth";
import { getStripeLiveDiagnostics } from "../../../../../../server/billing/stripeLiveDiagnostics";

export async function GET() {
  await requireAdminSession();

  return NextResponse.json(await getStripeLiveDiagnostics(), {
    headers: { "Cache-Control": "no-store" },
  });
}
