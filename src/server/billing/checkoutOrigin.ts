const FALLBACK_PUBLIC_ORIGIN = "https://shiftevidence.com";
const PUBLIC_HOSTS = new Set(["shiftevidence.com", "www.shiftevidence.com"]);
const INTERNAL_HOSTS = new Set(["0.0.0.0", "127.0.0.1", "::", "::1", "localhost"]);

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? null;
}

function isSafePublicHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  return PUBLIC_HOSTS.has(normalized) && !INTERNAL_HOSTS.has(normalized);
}

export function normalizeCheckoutOrigin(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value);
    const protocol = url.protocol.toLowerCase();

    if (protocol !== "https:" && protocol !== "http:") {
      return null;
    }

    if (!isSafePublicHostname(url.hostname)) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
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
