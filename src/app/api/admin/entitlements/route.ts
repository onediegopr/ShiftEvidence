import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import { listUserEntitlements, upsertUserEntitlementFromForm } from "../../../../server/admin/adminOpsService";

export async function GET() {
  await requireAdminSession();
  return NextResponse.json({ entitlements: await listUserEntitlements() }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const formData = await request.formData();
  const entitlement = await upsertUserEntitlementFromForm({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    formData,
  });

  return NextResponse.json({
    ok: true,
    entitlementId: entitlement.id,
  });
}
