import { NextResponse } from "next/server";
import { requireAdminSession } from "../../../../../../server/admin/adminAuth";
import { getBillingAdminLedgerSnapshot } from "../../../../../../server/billing/admin/billingAdminLedgerService";
import { getBillingReconciliationSnapshot } from "../../../../../../server/billing/admin/billingReconciliationService";
import { maskBillingProviderId } from "../../../../../../server/billing/admin/billingAdminLabels";

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

export async function GET() {
  await requireAdminSession();

  const ledger = await getBillingAdminLedgerSnapshot(100);
  const reconciliation = await getBillingReconciliationSnapshot(ledger);
  const orderProviderIds = new Map(ledger.recentOrders.map((order) => [order.id, maskBillingProviderId(order.providerOrderId)]));
  const headers = [
    "severity",
    "category",
    "provider",
    "plan",
    "customerEmail",
    "billingOrderId",
    "providerOrderIdMasked",
    "title",
    "detail",
    "action",
  ];
  const rows = reconciliation.items.map((item) => [
    item.severity,
    item.category,
    item.provider,
    item.planId ?? "",
    item.customerEmail ?? "",
    item.billingOrderId ?? "",
    item.billingOrderId ? orderProviderIds.get(item.billingOrderId) ?? "" : "",
    item.title,
    item.detail,
    item.action,
  ]);
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"billing-reconciliation.csv\"",
      "Cache-Control": "no-store",
    },
  });
}
