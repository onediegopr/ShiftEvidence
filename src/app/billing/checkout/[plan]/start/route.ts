import { NextResponse, type NextRequest } from "next/server";
import { getBillingPlanByCheckoutSlug } from "../../../../../config/billing";
import { getCheckoutPublicOrigin } from "../../../../../server/billing/checkoutOrigin";
import { createStripeCheckoutSession } from "../../../../../server/billing/stripeCheckout";

type BillingCheckoutStartRouteContext = {
  params: Promise<{
    plan: string;
  }>;
};

function redirectToCheckoutPage(origin: string, planSlug: string, params: Record<string, string>) {
  const url = new URL(`/billing/checkout/${planSlug}`, origin);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest, context: BillingCheckoutStartRouteContext) {
  const { plan: planSlug } = await context.params;
  const plan = getBillingPlanByCheckoutSlug(planSlug);
  const publicOrigin = getCheckoutPublicOrigin(request.headers);

  if (!plan) {
    return redirectToCheckoutPage(publicOrigin, planSlug, { error: "unsupported_plan" });
  }

  const result = await createStripeCheckoutSession(plan, publicOrigin);

  if (!result.ok) {
    return redirectToCheckoutPage(publicOrigin, planSlug, { error: result.reason });
  }

  return NextResponse.redirect(result.url, 303);
}
