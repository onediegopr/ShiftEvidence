import { billingPlans } from "../../../config/billing";
import type { BillingRiskLevel } from "./billingAdminLabels";

export type WiseBillingStatus =
  | "factura_manual"
  | "api_no_configurada"
  | "api_sandbox_configurada"
  | "api_produccion_configurada"
  | "error";

export type StripeBillingStatus =
  | "no_configurado"
  | "configurado_test"
  | "configurado_live_aprobado"
  | "configurado_live_no_aprobado"
  | "desactivado";

export type BillingOperationsReconciliation = "manual" | "parcial" | "automatizada";

export type BillingProviderLedgerSummary = {
  recentEventsCount: number;
  failedEventsCount: number;
  pendingEventsCount: number;
  ignoredEventsCount: number;
  lastEventAt: Date | null;
};

export type BillingProviderStatusSnapshot = {
  wise: {
    providerName: "Wise";
    status: WiseBillingStatus;
    tokenPresent: boolean;
    apiUrlMode: "sandbox" | "production" | "not_configured";
    profileIdPresent: boolean;
    currentUse: "Transferencia bancaria manual / invoice";
    automationEnabled: false;
    requestFlowEnabled: true;
    pendingInvoiceRequestsCount: number;
    lastVerification: "No verificada";
    recommendedAction: string;
    riskLevel: BillingRiskLevel;
  };
  stripe: {
    providerName: "Stripe";
    status: StripeBillingStatus;
    secretKeyPresent: boolean;
    webhookSecretPresent: boolean;
    starterPricePresent: boolean;
    professionalPricePresent: boolean;
    mspPricePresent: boolean;
    checkoutMode: "test" | "live";
    checkoutEnabled: boolean;
    checkoutActive: boolean;
    publiclyVisible: boolean;
    reason: string;
    recommendedAction: string;
    riskLevel: BillingRiskLevel;
  };
  operations: {
    checkoutTestMode: boolean;
    livePayments: boolean;
    manualFulfillment: boolean;
    bankTransferRequests: boolean;
    pendingInvoiceRequestsCount: number;
    webhooks: boolean;
    ledger: boolean;
    automaticEntitlements: boolean;
    reconciliation: BillingOperationsReconciliation;
    recentEventsCount: number;
    failedEventsCount: number;
    pendingEventsCount: number;
    ignoredEventsCount: number;
    lastEventAt: Date | null;
    recommendedAction: string;
  };
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function parseEnvBoolean(value: string | undefined) {
  const normalized = value?.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function getStripeCheckoutMode() {
  return process.env.STRIPE_CHECKOUT_MODE?.trim().toLowerCase() === "live" ? "live" : "test";
}

function getStripeSecretKeyMode() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim().replace(/^["']|["']$/g, "");
  if (secretKey?.startsWith("sk_live_")) return "live" as const;
  if (secretKey?.startsWith("sk_test_")) return "test" as const;
  return "unknown" as const;
}

function isStripeLivePaymentsApproved() {
  return parseEnvBoolean(process.env.STRIPE_LIVE_PAYMENTS_APPROVED);
}

function getWiseApiUrlMode() {
  const url = process.env.WISE_API_URL?.trim().toLowerCase();
  if (!url) return "not_configured" as const;
  if (url.includes("sandbox")) return "sandbox" as const;
  return "production" as const;
}

function isStripeCheckoutExplicitlyDisabled() {
  return process.env.STRIPE_CHECKOUT_ENABLED?.trim().toLowerCase() === "false";
}

function getStripeRecommendedAction(params: {
  configured: boolean;
  checkoutEnabled: boolean;
  checkoutMode: "test" | "live";
  keyModeMatches: boolean;
  livePaymentsApproved: boolean;
  webhookSecretPresent: boolean;
}) {
  if (!params.checkoutEnabled) {
    return "Checkout Stripe desactivado por configuracion. Mantener invoice manual.";
  }

  if (!params.configured) {
    return "Completar STRIPE_SECRET_KEY y Price IDs server-side antes de operar checkout.";
  }

  if (!params.keyModeMatches) {
    return "STRIPE_CHECKOUT_MODE no coincide con el modo de STRIPE_SECRET_KEY. Corregir env vars en Hostinger y reiniciar antes de checkout.";
  }

  if (params.checkoutMode === "live") {
    return params.livePaymentsApproved
      ? "Live aprobado por hito controlado. Operar solo el smoke autorizado y mantener fulfillment manual."
      : "Live detectado pero no aprobado. Mantener bloqueado hasta hito separado de go-live.";
  }

  if (!params.webhookSecretPresent) {
    return "Stripe test-mode puede crear checkout si los Price IDs estan presentes; falta webhook secret para capturar eventos.";
  }

  return "Mantener test-mode, fulfillment manual y webhooks sin grants automaticos.";
}

export function getBillingProviderStatusSnapshot(
  ledgerSummary: BillingProviderLedgerSummary = {
    recentEventsCount: 0,
    failedEventsCount: 0,
    pendingEventsCount: 0,
    ignoredEventsCount: 0,
    lastEventAt: null,
  },
  invoiceSummary: {
    pendingInvoiceRequestsCount?: number;
  } = {},
): BillingProviderStatusSnapshot {
  const pendingInvoiceRequestsCount = invoiceSummary.pendingInvoiceRequestsCount ?? 0;
  const stripeSecretKeyPresent = hasEnv("STRIPE_SECRET_KEY");
  const stripeWebhookSecretPresent = hasEnv("STRIPE_WEBHOOK_SECRET");
  const stripeSecretKeyMode = getStripeSecretKeyMode();
  const stripeStarterPricePresent = hasEnv("STRIPE_STARTER_PRICE_ID");
  const stripeProfessionalPricePresent = hasEnv("STRIPE_PROFESSIONAL_PRICE_ID");
  const stripeMspPricePresent = hasEnv("STRIPE_MSP_PRICE_ID");
  const stripeCheckoutMode = getStripeCheckoutMode();
  const stripeLivePaymentsApproved = isStripeLivePaymentsApproved();
  const stripeCheckoutEnabled = !isStripeCheckoutExplicitlyDisabled();
  const stripeConfigured = stripeSecretKeyPresent && stripeStarterPricePresent && stripeProfessionalPricePresent && stripeMspPricePresent;
  const stripeKeyModeMatches =
    !stripeSecretKeyPresent ||
    (stripeCheckoutMode === "live" ? stripeSecretKeyMode === "live" : stripeSecretKeyMode === "test");
  const livePayments =
    stripeConfigured &&
    stripeCheckoutMode === "live" &&
    stripeCheckoutEnabled &&
    stripeLivePaymentsApproved &&
    stripeKeyModeMatches;
  const stripeCheckoutActive =
    stripeConfigured &&
    stripeCheckoutEnabled &&
    stripeKeyModeMatches &&
    (stripeCheckoutMode === "test" || livePayments);
  const stripeStatus: StripeBillingStatus = !stripeCheckoutEnabled
    ? "desactivado"
    : !stripeConfigured
      ? "no_configurado"
      : !stripeKeyModeMatches
        ? "configurado_live_no_aprobado"
        : stripeCheckoutMode === "live"
          ? stripeLivePaymentsApproved
            ? "configurado_live_aprobado"
            : "configurado_live_no_aprobado"
          : "configurado_test";
  const wiseTokenPresent = hasEnv("WISE_API_TOKEN");
  const wiseProfileIdPresent = hasEnv("WISE_PROFILE_ID");
  const wiseApiUrlMode = getWiseApiUrlMode();
  const wiseStatus: WiseBillingStatus = !wiseTokenPresent
    ? "factura_manual"
    : wiseApiUrlMode === "sandbox"
      ? "api_sandbox_configurada"
      : wiseApiUrlMode === "production"
        ? "api_produccion_configurada"
        : "api_no_configurada";

  return {
    wise: {
      providerName: "Wise",
      status: wiseStatus,
      tokenPresent: wiseTokenPresent,
      apiUrlMode: wiseApiUrlMode,
      profileIdPresent: wiseProfileIdPresent,
      currentUse: "Transferencia bancaria manual / invoice",
      automationEnabled: false,
      requestFlowEnabled: true,
      pendingInvoiceRequestsCount,
      lastVerification: "No verificada",
      recommendedAction:
        "Wise se usa como referencia manual para facturas y transferencias bancarias. No automatizar recipients, balances ni transfers.",
      riskLevel: wiseTokenPresent && wiseApiUrlMode === "production" ? "medio" : "bajo",
    },
    stripe: {
      providerName: "Stripe",
      status: stripeStatus,
      secretKeyPresent: stripeSecretKeyPresent,
      webhookSecretPresent: stripeWebhookSecretPresent,
      starterPricePresent: stripeStarterPricePresent,
      professionalPricePresent: stripeProfessionalPricePresent,
      mspPricePresent: stripeMspPricePresent,
      checkoutMode: stripeCheckoutMode,
      checkoutEnabled: stripeCheckoutEnabled,
      checkoutActive: stripeCheckoutActive,
      publiclyVisible: true,
      reason: stripeCheckoutActive
        ? stripeCheckoutMode === "live"
          ? "Stripe live esta aprobado para el smoke controlado de BILLING-9."
          : "Stripe es el provider principal configurable en test-mode."
        : stripeCheckoutMode === "live"
          ? "Live detectado pero bloqueado por policy hasta aprobacion explicita."
          : "Faltan variables Stripe o checkout esta desactivado.",
      recommendedAction: getStripeRecommendedAction({
        configured: stripeConfigured,
        checkoutEnabled: stripeCheckoutEnabled,
        checkoutMode: stripeCheckoutMode,
        keyModeMatches: stripeKeyModeMatches,
        livePaymentsApproved: stripeLivePaymentsApproved,
        webhookSecretPresent: stripeWebhookSecretPresent,
      }),
      riskLevel: stripeCheckoutMode === "live" ? (stripeLivePaymentsApproved ? "medio" : "alto") : stripeConfigured ? "bajo" : "medio",
    },
    operations: {
      checkoutTestMode: stripeCheckoutMode === "test" && stripeCheckoutActive,
      livePayments,
      manualFulfillment: true,
      bankTransferRequests: true,
      pendingInvoiceRequestsCount,
      webhooks: stripeWebhookSecretPresent || ledgerSummary.recentEventsCount > 0,
      ledger: true,
      automaticEntitlements: false,
      reconciliation: "manual",
      recentEventsCount: ledgerSummary.recentEventsCount,
      failedEventsCount: ledgerSummary.failedEventsCount,
      pendingEventsCount: ledgerSummary.pendingEventsCount,
      ignoredEventsCount: ledgerSummary.ignoredEventsCount,
      lastEventAt: ledgerSummary.lastEventAt,
      recommendedAction:
        "Mantener fulfillment manual. No otorgar accesos sin verificar Stripe/admin ledger y el runbook operativo.",
    },
  };
}

export function getCheckoutPlanLinks() {
  return billingPlans
    .filter((plan) => plan.checkoutSlug)
    .map((plan) => ({
      label: plan.displayName,
      href: `/billing/checkout/${plan.checkoutSlug}`,
    }));
}
