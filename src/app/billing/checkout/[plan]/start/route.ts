import { NextResponse, type NextRequest } from "next/server";
import { getBillingPlanByCheckoutSlug } from "../../../../../config/billing";
import { createLemonSqueezyCheckout } from "../../../../../server/billing/lemonSqueezyCheckout";

type BillingCheckoutStartRouteContext = {
  params: Promise<{
    plan: string;
  }>;
};

function redirectToCheckoutPage(request: NextRequest, planSlug: string, params: Record<string, string>) {
  const url = new URL(`/billing/checkout/${planSlug}`, request.url);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest, context: BillingCheckoutStartRouteContext) {
  const { plan: planSlug } = await context.params;
  const plan = getBillingPlanByCheckoutSlug(planSlug);

  if (!plan) {
    return redirectToCheckoutPage(request, planSlug, { error: "unsupported_plan" });
  }

  const result = await createLemonSqueezyCheckout(plan, request.url);

  if (!result.ok) {
    return redirectToCheckoutPage(request, planSlug, { error: result.reason });
  }

  return NextResponse.redirect(result.url, 303);
}
