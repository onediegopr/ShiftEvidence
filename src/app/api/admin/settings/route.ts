import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import { getAdminAiBudgetSummary, parseAiBudgetForm, updateAiBudgetSettings } from "../../../../server/admin/adminOpsService";

export async function GET() {
  await requireAdminSession();
  return NextResponse.json(await getAdminAiBudgetSummary(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const formData = await request.formData();
  const setting = await updateAiBudgetSettings({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    settings: parseAiBudgetForm(formData),
  });

  return NextResponse.json({
    ok: true,
    settingId: setting.id,
  });
}
