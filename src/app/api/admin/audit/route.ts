import { NextResponse } from "next/server";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import { getAdvancedAuditEvents, recordAdminAuditEvent } from "../../../../server/admin/adminOpsService";

export async function GET() {
  const session = await requireAdminSession();
  await recordAdminAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    eventType: "admin_audit_checked",
    entityType: "AuditEvent",
    message: "Auditoria revisada desde endpoint admin.",
  });

  return NextResponse.json({ events: await getAdvancedAuditEvents() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
