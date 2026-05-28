import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "../../../../../server/admin/adminAuth";
import { upsertUserEntitlementFromForm } from "../../../../../server/admin/adminOpsService";

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
