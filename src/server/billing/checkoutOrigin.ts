import { normalizeTrustedAppUrlOrigin } from "../security/trustedOrigins";

const FALLBACK_PUBLIC_ORIGIN = "https://shiftevidence.com";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? null;
}

export function normalizeCheckoutOrigin(value: string | null | undefined) {
  return normalizeTrustedAppUrlOrigin(value);
}

function originFromForwardedHeaders(headers: Headers) {
  const forwardedHost = firstHeaderValue(headers.get("x-forwarded-host"));
  const host = forwardedHost ?? firstHeaderValue(headers.get("host"));
  const forwardedProto = firstHeaderValue(headers.get("x-forwarded-proto"));
  const protocol = forwardedProto === "http" ? "http" : "https";

  if (!host) {
    return null;
  }

  return normalizeCheckoutOrigin(`${protocol}://${host}`);
}

export function getCheckoutPublicOrigin(headers: Headers) {
  return (
    normalizeCheckoutOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeCheckoutOrigin(process.env.BETTER_AUTH_URL) ??
    originFromForwardedHeaders(headers) ??
    FALLBACK_PUBLIC_ORIGIN
  );
}
