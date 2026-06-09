import { NextResponse, type NextRequest } from "next/server";
import { getBillingPlanByCheckoutSlug } from "../../../../../config/billing";
import { auth } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
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

async function getCheckoutCustomerContext(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) return {};

    const workspace = await prisma.workspace.findFirst({
      where: {
        ownerUserId: session.user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
      },
    });

    return {
      userId: session.user.id,
      customerEmail: session.user.email,
      workspaceId: workspace?.id ?? null,
    };
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest, context: BillingCheckoutStartRouteContext) {
  const { plan: planSlug } = await context.params;
  const plan = getBillingPlanByCheckoutSlug(planSlug);
  const publicOrigin = getCheckoutPublicOrigin(request.headers);

  if (!plan) {
    return redirectToCheckoutPage(publicOrigin, planSlug, { error: "unsupported_plan" });
  }

  let result: Awaited<ReturnType<typeof createStripeCheckoutSession>>;
  try {
    const customerContext = await getCheckoutCustomerContext(request);
    result = await createStripeCheckoutSession(plan, publicOrigin, customerContext);
  } catch {
    console.error("stripe_checkout_unhandled_error", { planSlug });
    return redirectToCheckoutPage(publicOrigin, planSlug, { error: "stripe_runtime_error" });
  }

  if (!result.ok) {
    return redirectToCheckoutPage(publicOrigin, planSlug, { error: result.reason });
  }

  return NextResponse.redirect(result.url, 303);
}
