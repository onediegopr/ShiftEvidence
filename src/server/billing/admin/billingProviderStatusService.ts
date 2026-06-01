import { billingPlans } from "../../../config/billing";
import type { BillingRiskLevel } from "./billingAdminLabels";

export type LemonBillingStatus =
  | "no_configurado"
  | "configurado_test"
  | "configurado_live"
  | "error"
  | "desactivado";

export type WiseBillingStatus =
  | "factura_manual"
  | "api_no_configurada"
  | "api_sandbox_configurada"
  | "api_produccion_configurada"
  | "error";

export type StripeBillingStatus = "diferido_desactivado";

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
    checkoutEnabled: boolean;
    webhookSecretPresent: boolean;
    webhookEndpointAvailable: boolean;
    webhookStatus: "no_configurado" | "endpoint_disponible" | "secreto_presente" | "eventos_recibidos" | "errores";
    lastSmokeStatus: "ok" | "not_run" | "failed" | "unknown";
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
    publiclyVisible: false;
    checkoutActive: false;
    reason: "Proveedor opcional futuro";
    recommendedAction: "No configurar todavia.";
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

function getCheckoutMode() {
  const raw = process.env.LEMON_SQUEEZY_CHECKOUT_MODE?.trim().toLowerCase();
  if (raw === "live") return "live" as const;
  if (raw === "test" || !raw) return "test" as const;
  return "unknown" as const;
}

function isCheckoutExplicitlyDisabled() {
  return process.env.LEMON_SQUEEZY_CHECKOUT_ENABLED?.trim().toLowerCase() === "false";
}

function getWiseApiUrlMode() {
  const url = process.env.WISE_API_URL?.trim().toLowerCase();
  if (!url) return "not_configured" as const;
  if (url.includes("sandbox")) return "sandbox" as const;
  return "production" as const;
}

function getLemonRecommendedAction(params: {
  configured: boolean;
  checkoutEnabled: boolean;
  checkoutMode: "test" | "live" | "unknown";
  webhookSecretPresent: boolean;
  failedEventsCount: number;
}) {
  if (!params.checkoutEnabled) {
    return "Checkout desactivado. Mantener fulfillment manual y revisar configuracion antes de activar.";
  }

  if (!params.configured) {
    return "Completar Store ID, API key y Variant IDs server-side antes de operar checkout.";
  }

  if (params.checkoutMode === "live" && !params.webhookSecretPresent) {
    return "Riesgo alto: live activo sin webhook secret. Volver a test o completar webhook antes de operar.";
  }

  if (params.failedEventsCount > 0) {
    return "Revisar eventos fallidos antes de otorgar accesos manuales.";
  }

  if (!params.webhookSecretPresent) {
    return "Checkout test-mode operativo. Falta configurar webhook secret para smoke de eventos.";
  }

  return "Mantener test-mode y fulfillment manual hasta completar conciliacion y grants controlados.";
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
  const checkoutMode = getCheckoutMode();
  const checkoutEnabled = !isCheckoutExplicitlyDisabled();
  const requiredCheckoutConfigured =
    storeIdPresent &&
    (apiKeyPresent || apiKeyAliasPresent) &&
    starterVariantPresent &&
    professionalVariantPresent &&
    mspVariantPresent;
  const livePayments = checkoutMode === "live" && requiredCheckoutConfigured && checkoutEnabled;
  const lemonStatus: LemonBillingStatus = !checkoutEnabled
    ? "desactivado"
    : !requiredCheckoutConfigured
      ? "no_configurado"
      : checkoutMode === "live"
        ? "configurado_live"
        : "configurado_test";
  const webhookStatus = ledgerSummary.failedEventsCount > 0
    ? "errores"
    : ledgerSummary.recentEventsCount > 0
      ? "eventos_recibidos"
      : webhookSecretPresent
        ? "secreto_presente"
        : "endpoint_disponible";
  const lemonRiskLevel: BillingRiskLevel = livePayments && !webhookSecretPresent
    ? "alto"
    : !requiredCheckoutConfigured || ledgerSummary.failedEventsCount > 0
      ? "medio"
      : "bajo";
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
      lastSmokeStatus: requiredCheckoutConfigured && checkoutMode === "test" ? "ok" : "unknown",
      recommendedAction: getLemonRecommendedAction({
        configured: requiredCheckoutConfigured,
        checkoutEnabled,
        checkoutMode,
        webhookSecretPresent,
        failedEventsCount: ledgerSummary.failedEventsCount,
      }),
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
      status: "diferido_desactivado",
      publiclyVisible: false,
      checkoutActive: false,
      reason: "Proveedor opcional futuro",
      recommendedAction: "No configurar todavia.",
      riskLevel: "bajo",
    },
    operations: {
      checkoutTestMode: requiredCheckoutConfigured && checkoutMode === "test" && checkoutEnabled,
      livePayments,
      manualFulfillment: true,
      webhooks: webhookSecretPresent || ledgerSummary.recentEventsCount > 0,
      ledger: true,
      automaticEntitlements: false,
      reconciliation: "manual",
      recentEventsCount: ledgerSummary.recentEventsCount,
      failedEventsCount: ledgerSummary.failedEventsCount,
      pendingEventsCount: ledgerSummary.pendingEventsCount,
      ignoredEventsCount: ledgerSummary.ignoredEventsCount,
      lastEventAt: ledgerSummary.lastEventAt,
      recommendedAction:
        "Mantener fulfillment manual. No otorgar accesos sin verificar Lemon y el runbook operativo.",
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
