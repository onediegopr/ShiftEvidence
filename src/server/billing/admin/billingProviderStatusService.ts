import { billingPlans } from "../../../config/billing";
import type { BillingRiskLevel } from "./billingAdminLabels";

export type LemonBillingStatus =
  | "no_configurado"
  | "legado_desactivado"
  | "rechazado_legacy";

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
  lemon: {
    providerName: "Lemon Squeezy";
    status: LemonBillingStatus;
    storeIdPresent: boolean;
    apiKeyPresent: boolean;
    apiKeyAliasPresent: boolean;
    starterVariantPresent: boolean;
    professionalVariantPresent: boolean;
    mspVariantPresent: boolean;
    checkoutMode: "test" | "live" | "unknown";
    checkoutEnabled: false;
    webhookSecretPresent: boolean;
    webhookEndpointAvailable: boolean;
    webhookStatus: "legado" | "eventos_recibidos" | "errores";
    lastSmokeStatus: "legacy_disabled";
    recommendedAction: string;
    riskLevel: BillingRiskLevel;
  };
  wise: {
    providerName: "Wise";
    status: WiseBillingStatus;
    tokenPresent: boolean;
    apiUrlMode: "sandbox" | "production" | "not_configured";
    profileIdPresent: boolean;
    currentUse: "Transferencia bancaria manual / invoice";
    automationEnabled: false;
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

function getLemonCheckoutMode() {
  const raw = process.env.LEMON_SQUEEZY_CHECKOUT_MODE?.trim().toLowerCase();
  if (raw === "live") return "live" as const;
  if (raw === "test" || !raw) return "test" as const;
  return "unknown" as const;
}

function getStripeCheckoutMode() {
  return process.env.STRIPE_CHECKOUT_MODE?.trim().toLowerCase() === "live" ? "live" : "test";
}

function isStripeLivePaymentsApproved() {
  return process.env.STRIPE_LIVE_PAYMENTS_APPROVED?.trim() === "true";
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
  webhookSecretPresent: boolean;
}) {
  if (!params.checkoutEnabled) {
    return "Checkout Stripe desactivado por configuracion. Mantener invoice manual.";
  }

  if (!params.configured) {
    return "Completar STRIPE_SECRET_KEY y Price IDs server-side antes de operar checkout.";
  }

  if (params.checkoutMode === "live") {
    return params.checkoutEnabled
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
): BillingProviderStatusSnapshot {
  const storeIdPresent = hasEnv("LEMON_SQUEEZY_STORE_ID");
  const apiKeyPresent = hasEnv("LEMON_SQUEEZY_API_KEY");
  const apiKeyAliasPresent = hasEnv("LEMONSQUEEZY_API_KEY");
  const starterVariantPresent = hasEnv("LEMON_STARTER_VARIANT_ID");
  const professionalVariantPresent = hasEnv("LEMON_PROFESSIONAL_VARIANT_ID");
  const mspVariantPresent = hasEnv("LEMON_MSP_VARIANT_ID");
  const webhookSecretPresent = hasEnv("LEMON_SQUEEZY_WEBHOOK_SECRET") || hasEnv("LEMONSQUEEZY_WEBHOOK_SECRET");
  const checkoutMode = getLemonCheckoutMode();
  const checkoutEnabled = false;
  const requiredCheckoutConfigured =
    storeIdPresent &&
    (apiKeyPresent || apiKeyAliasPresent) &&
    starterVariantPresent &&
    professionalVariantPresent &&
    mspVariantPresent;
  const lemonStatus: LemonBillingStatus = requiredCheckoutConfigured ? "rechazado_legacy" : "legado_desactivado";
  const webhookStatus = ledgerSummary.failedEventsCount > 0
    ? "errores"
    : ledgerSummary.recentEventsCount > 0
      ? "eventos_recibidos"
      : "legado";
  const lemonRiskLevel: BillingRiskLevel = ledgerSummary.failedEventsCount > 0 ? "medio" : "bajo";
  const stripeSecretKeyPresent = hasEnv("STRIPE_SECRET_KEY");
  const stripeWebhookSecretPresent = hasEnv("STRIPE_WEBHOOK_SECRET");
  const stripeStarterPricePresent = hasEnv("STRIPE_STARTER_PRICE_ID");
  const stripeProfessionalPricePresent = hasEnv("STRIPE_PROFESSIONAL_PRICE_ID");
  const stripeMspPricePresent = hasEnv("STRIPE_MSP_PRICE_ID");
  const stripeCheckoutMode = getStripeCheckoutMode();
  const stripeLivePaymentsApproved = isStripeLivePaymentsApproved();
  const stripeCheckoutEnabled = !isStripeCheckoutExplicitlyDisabled();
  const stripeConfigured = stripeSecretKeyPresent && stripeStarterPricePresent && stripeProfessionalPricePresent && stripeMspPricePresent;
  const livePayments = stripeConfigured && stripeCheckoutMode === "live" && stripeCheckoutEnabled && stripeLivePaymentsApproved;
  const stripeCheckoutActive =
    stripeConfigured &&
    stripeCheckoutEnabled &&
    (stripeCheckoutMode === "test" || livePayments);
  const stripeStatus: StripeBillingStatus = !stripeCheckoutEnabled
    ? "desactivado"
    : !stripeConfigured
      ? "no_configurado"
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
    lemon: {
      providerName: "Lemon Squeezy",
      status: lemonStatus,
      storeIdPresent,
      apiKeyPresent,
      apiKeyAliasPresent,
      starterVariantPresent,
      professionalVariantPresent,
      mspVariantPresent,
      checkoutMode,
      checkoutEnabled,
      webhookSecretPresent,
      webhookEndpointAvailable: true,
      webhookStatus,
      lastSmokeStatus: "legacy_disabled",
      recommendedAction:
        "Lemon Squeezy queda como legado historico deshabilitado tras rechazo del offering como servicios. No crear nuevos checkouts Lemon.",
      riskLevel: lemonRiskLevel,
    },
    wise: {
      providerName: "Wise",
      status: wiseStatus,
      tokenPresent: wiseTokenPresent,
      apiUrlMode: wiseApiUrlMode,
      profileIdPresent: wiseProfileIdPresent,
      currentUse: "Transferencia bancaria manual / invoice",
      automationEnabled: false,
      lastVerification: "No verificada",
      recommendedAction:
        "Wise se usa actualmente como soporte operativo para facturas y transferencias manuales. No automatizar todavia.",
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
        webhookSecretPresent: stripeWebhookSecretPresent,
      }),
      riskLevel: stripeCheckoutMode === "live" ? (stripeLivePaymentsApproved ? "medio" : "alto") : stripeConfigured ? "bajo" : "medio",
    },
    operations: {
      checkoutTestMode: stripeCheckoutMode === "test" && stripeCheckoutActive,
      livePayments,
      manualFulfillment: true,
      webhooks: stripeWebhookSecretPresent || webhookSecretPresent || ledgerSummary.recentEventsCount > 0,
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
