import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import { getAdminPagination } from "../../../../server/admin/adminPagination";
import { getAdvancedAuditEventsPage, recordAdminAuditEvent } from "../../../../server/admin/adminOpsService";

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  const { searchParams } = new URL(request.url);
  const pagination = getAdminPagination(searchParams);

  await recordAdminAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    eventType: "admin_audit_checked",
    entityType: "AuditEvent",
    message: "Auditoria revisada desde endpoint admin.",
  });

  return NextResponse.json(await getAdvancedAuditEventsPage(pagination), {
    headers: { "Cache-Control": "no-store" },
  });
}
