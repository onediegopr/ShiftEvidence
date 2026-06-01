import { billingPlans, type BillingCheckoutSlug, type BillingPlanConfig } from "../../config/billing";
import {
  getStripeCheckoutMode,
  getStripeSecretKeyMode,
  isStripeLivePaymentsApproved,
  readStripeSecretKey,
} from "./stripeCheckout";

const STRIPE_ACCOUNT_API_URL = "https://api.stripe.com/v1/account";
const STRIPE_PRICE_API_URL = "https://api.stripe.com/v1/prices";
const STRIPE_DIAGNOSTIC_TIMEOUT_MS = 8000;

export type StripeLiveDiagnosticSecretKeyMode = "live" | "test" | "restricted_live" | "unknown" | "missing";

type StripeDiagnosticFetchErrorCode =
  | "missing_secret"
  | "missing_price_id"
  | "stripe_auth_error"
  | "stripe_price_not_found"
  | "stripe_rate_limited"
  | "stripe_timeout"
  | "stripe_network_error"
  | "stripe_api_error"
  | "stripe_parse_error";

type StripeDiagnosticFetchErrorType = "configuration" | "auth" | "not_found" | "rate_limit" | "timeout" | "network" | "stripe" | "parse";
type StripeDiagnosticFetchFailure = {
  errorCode: StripeDiagnosticFetchErrorCode;
  errorType: StripeDiagnosticFetchErrorType;
};

export type StripeLivePriceDiagnostic = {
  planId: BillingPlanConfig["id"];
  slug: BillingCheckoutSlug;
  displayName: string;
  priceEnvName: string | null;
  pricePresent: boolean;
  priceIdMasked: string | null;
  reachable: boolean;
  livemode: boolean | null;
  livemodeOk: boolean;
  active: boolean | null;
  activeOk: boolean;
  currency: string | null;
  currencyOk: boolean;
  unitAmount: number | null;
  unitAmountOk: boolean;
  recurringInterval: string | null;
  recurringOk: boolean;
  sane: boolean;
  errorCode: StripeDiagnosticFetchErrorCode | null;
  errorType: StripeDiagnosticFetchErrorType | null;
};

export type StripeLiveDiagnostics = {
  checkedAt: string;
  runtimeEnv: {
    secretKeyPresent: boolean;
    secretKeyMode: StripeLiveDiagnosticSecretKeyMode;
    webhookSecretPresent: boolean;
    starterPricePresent: boolean;
    professionalPricePresent: boolean;
    mspPricePresent: boolean;
    checkoutMode: "test" | "live";
    livePaymentsApproved: boolean;
    checkoutEnabled: boolean;
    appUrlPresent: boolean;
  };
  stripeApi: {
    canAuthenticate: boolean;
    stripeAccountReachable: boolean;
    errorCode: StripeDiagnosticFetchErrorCode | null;
    errorType: StripeDiagnosticFetchErrorType | null;
  };
  prices: Record<BillingCheckoutSlug, StripeLivePriceDiagnostic>;
  overall: {
    readyForLiveCheckoutPrepaymentSmoke: boolean;
    blockers: string[];
    warnings: string[];
  };
};

type StripePriceResponse = {
  id?: string;
  active?: boolean;
  currency?: string;
  livemode?: boolean;
  unit_amount?: number | null;
  recurring?: {
    interval?: string | null;
  } | null;
};

function readEnv(name: string) {
  const value = process.env[name]?.trim().replace(/^["']|["']$/g, "");
  return value ? value : null;
}

function parseEnvBoolean(value: string | null) {
  const normalized = value?.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function isStripeCheckoutEnabled() {
  return parseEnvBoolean(readEnv("STRIPE_CHECKOUT_ENABLED"));
}

export function maskStripeId(value: string | null | undefined) {
  const normalized = value?.trim().replace(/^["']|["']$/g, "");
  if (!normalized) return null;
  if (normalized.length <= 12) return `${normalized.slice(0, 6)}...`;
  return `${normalized.slice(0, 8)}...${normalized.slice(-4)}`;
}

function getPricePlan(slug: BillingCheckoutSlug) {
  const plan = billingPlans.find((candidate) => candidate.checkoutSlug === slug);
  if (!plan) {
    throw new Error(`Missing billing plan for ${slug}`);
  }

  return plan;
}

function expectedUnitAmount(plan: BillingPlanConfig) {
  return plan.priceAmountUsd * 100;
}

function expectedRecurringInterval(plan: BillingPlanConfig) {
  return plan.cadence === "monthly" ? "month" : null;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function classifyStripeResponse(status: number): StripeDiagnosticFetchFailure {
  if (status === 401 || status === 403) return { errorCode: "stripe_auth_error", errorType: "auth" };
  if (status === 404) return { errorCode: "stripe_price_not_found", errorType: "not_found" };
  if (status === 429) return { errorCode: "stripe_rate_limited", errorType: "rate_limit" };
  return { errorCode: "stripe_api_error", errorType: "stripe" };
}

function classifyFetchError(error: unknown): StripeDiagnosticFetchFailure {
  if (isAbortError(error)) return { errorCode: "stripe_timeout", errorType: "timeout" };
  return { errorCode: "stripe_network_error", errorType: "network" };
}

async function fetchStripeJson(url: string, secretKey: string): Promise<{
  ok: true;
  payload: unknown;
} | {
  ok: false;
  errorCode: StripeDiagnosticFetchErrorCode;
  errorType: StripeDiagnosticFetchErrorType;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STRIPE_DIAGNOSTIC_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, ...classifyStripeResponse(response.status) };
    }

    try {
      return { ok: true, payload: await response.json() };
    } catch {
      return { ok: false, errorCode: "stripe_parse_error", errorType: "parse" };
    }
  } catch (error) {
    return { ok: false, ...classifyFetchError(error) };
  } finally {
    clearTimeout(timeout);
  }
}

function missingPriceDiagnostic(plan: BillingPlanConfig): StripeLivePriceDiagnostic {
  return {
    planId: plan.id,
    slug: plan.checkoutSlug as BillingCheckoutSlug,
    displayName: plan.displayName,
    priceEnvName: plan.stripePriceEnvName,
    pricePresent: false,
    priceIdMasked: null,
    reachable: false,
    livemode: null,
    livemodeOk: false,
    active: null,
    activeOk: false,
    currency: null,
    currencyOk: false,
    unitAmount: null,
    unitAmountOk: false,
    recurringInterval: null,
    recurringOk: false,
    sane: false,
    errorCode: "missing_price_id",
    errorType: "configuration",
  };
}

async function diagnosePrice(plan: BillingPlanConfig, secretKey: string | null): Promise<StripeLivePriceDiagnostic> {
  const priceId = plan.stripePriceEnvName ? readEnv(plan.stripePriceEnvName) : null;
  if (!priceId) return missingPriceDiagnostic(plan);

  const base = {
    planId: plan.id,
    slug: plan.checkoutSlug as BillingCheckoutSlug,
    displayName: plan.displayName,
    priceEnvName: plan.stripePriceEnvName,
    pricePresent: true,
    priceIdMasked: maskStripeId(priceId),
  };

  if (!secretKey) {
    return {
      ...base,
      reachable: false,
      livemode: null,
      livemodeOk: false,
      active: null,
      activeOk: false,
      currency: null,
      currencyOk: false,
      unitAmount: null,
      unitAmountOk: false,
      recurringInterval: null,
      recurringOk: false,
      sane: false,
      errorCode: "missing_secret",
      errorType: "configuration",
    };
  }

  const result = await fetchStripeJson(`${STRIPE_PRICE_API_URL}/${encodeURIComponent(priceId)}`, secretKey);
  if (!result.ok) {
    return {
      ...base,
      reachable: false,
      livemode: null,
      livemodeOk: false,
      active: null,
      activeOk: false,
      currency: null,
      currencyOk: false,
      unitAmount: null,
      unitAmountOk: false,
      recurringInterval: null,
      recurringOk: false,
      sane: false,
      errorCode: result.errorCode,
      errorType: result.errorType,
    };
  }

  const payload = result.payload as StripePriceResponse;
  const recurringInterval = payload.recurring?.interval ?? null;
  const livemodeOk = payload.livemode === true;
  const activeOk = payload.active === true;
  const currencyOk = payload.currency?.toLowerCase() === "usd";
  const unitAmountOk = payload.unit_amount === expectedUnitAmount(plan);
  const recurringOk = recurringInterval === expectedRecurringInterval(plan);
  const sane = livemodeOk && activeOk && currencyOk && unitAmountOk && recurringOk;

  return {
    ...base,
    reachable: true,
    livemode: payload.livemode ?? null,
    livemodeOk,
    active: payload.active ?? null,
    activeOk,
    currency: payload.currency ?? null,
    currencyOk,
    unitAmount: payload.unit_amount ?? null,
    unitAmountOk,
    recurringInterval,
    recurringOk,
    sane,
    errorCode: null,
    errorType: null,
  };
}

function getSecretKeyMode(): StripeLiveDiagnosticSecretKeyMode {
  const secretKey = readStripeSecretKey();
  if (!secretKey) return "missing";
  return getStripeSecretKeyMode(secretKey);
}

function pricePresence(slug: BillingCheckoutSlug) {
  const plan = getPricePlan(slug);
  return Boolean(plan.stripePriceEnvName && readEnv(plan.stripePriceEnvName));
}

export async function getStripeLiveDiagnostics(): Promise<StripeLiveDiagnostics> {
  const secretKey = readStripeSecretKey();
  const secretKeyMode = getSecretKeyMode();
  const checkoutMode = getStripeCheckoutMode();
  const checkoutEnabled = isStripeCheckoutEnabled();
  const livePaymentsApproved = isStripeLivePaymentsApproved();
  const webhookSecretPresent = Boolean(readEnv("STRIPE_WEBHOOK_SECRET"));
  const appUrlPresent = Boolean(readEnv("NEXT_PUBLIC_APP_URL"));
  const blockers: string[] = [];
  const warnings: string[] = [];

  const accountResult = secretKey
    ? await fetchStripeJson(STRIPE_ACCOUNT_API_URL, secretKey)
    : { ok: false as const, errorCode: "missing_secret" as const, errorType: "configuration" as const };

  if (secretKeyMode !== "live") {
    blockers.push("STRIPE_SECRET_KEY debe ser sk_live_ para smoke live pre-payment.");
  }
  if (!webhookSecretPresent) blockers.push("STRIPE_WEBHOOK_SECRET no esta presente.");
  if (checkoutMode !== "live") blockers.push("STRIPE_CHECKOUT_MODE debe estar en live para el smoke live.");
  if (!livePaymentsApproved) blockers.push("STRIPE_LIVE_PAYMENTS_APPROVED no esta aprobado.");
  if (!appUrlPresent) blockers.push("NEXT_PUBLIC_APP_URL no esta presente.");
  if (!checkoutEnabled) warnings.push("STRIPE_CHECKOUT_ENABLED=false: checkout publico sigue deshabilitado, como se espera en FIX-3.");

  const [starter, professional, msp] = await Promise.all([
    diagnosePrice(getPricePlan("starter"), secretKey),
    diagnosePrice(getPricePlan("professional"), secretKey),
    diagnosePrice(getPricePlan("msp"), secretKey),
  ]);

  const priceDiagnostics = { starter, professional, msp };

  Object.values(priceDiagnostics).forEach((price) => {
    if (!price.sane) {
      blockers.push(`${price.displayName}: Stripe Price live no esta saneado para monto/currency/cadencia esperados.`);
    }
  });

  const stripeApi = accountResult.ok
    ? {
        canAuthenticate: true,
        stripeAccountReachable: true,
        errorCode: null,
        errorType: null,
      }
    : {
        canAuthenticate: false,
        stripeAccountReachable: false,
        errorCode: accountResult.errorCode,
        errorType: accountResult.errorType,
      };

  if (!stripeApi.canAuthenticate) {
    blockers.push("Stripe API no autentica desde runtime con la key server-side configurada.");
  }

  return {
    checkedAt: new Date().toISOString(),
    runtimeEnv: {
      secretKeyPresent: Boolean(secretKey),
      secretKeyMode,
      webhookSecretPresent,
      starterPricePresent: pricePresence("starter"),
      professionalPricePresent: pricePresence("professional"),
      mspPricePresent: pricePresence("msp"),
      checkoutMode,
      livePaymentsApproved,
      checkoutEnabled,
      appUrlPresent,
    },
    stripeApi,
    prices: priceDiagnostics,
    overall: {
      readyForLiveCheckoutPrepaymentSmoke: blockers.length === 0,
      blockers,
      warnings,
    },
  };
}
