import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import { getCommercialOpportunities, updateCommercialOpportunityFromForm } from "../../../../server/admin/adminOpsService";

export async function GET() {
  await requireAdminSession();
  return NextResponse.json({ opportunities: await getCommercialOpportunities() }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const formData = await request.formData();
  const opportunity = await updateCommercialOpportunityFromForm({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    formData,
  });

  return NextResponse.json({
    ok: true,
    opportunityId: opportunity.id,
  });
}
