const PRODUCTION_TRUSTED_ORIGINS = ["https://shiftevidence.com", "https://www.shiftevidence.com"] as const;
const LOCAL_TRUSTED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"] as const;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function hasPathSearchOrHash(url: URL) {
  return (url.pathname !== "" && url.pathname !== "/") || url.search !== "" || url.hash !== "";
}

function hasUnsafeUrlParts(url: URL) {
  return url.username !== "" || url.password !== "" || url.hostname.includes("*");
}

function isLocalHttpOrigin(url: URL) {
  return url.protocol === "http:" && LOCAL_HOSTNAMES.has(url.hostname.toLowerCase());
}

export function normalizeOrigin(origin: string | null | undefined) {
  if (!origin?.trim() || origin.includes("*")) {
    return null;
  }

  try {
    const url = new URL(origin.trim());

    if (hasUnsafeUrlParts(url) || hasPathSearchOrHash(url)) {
      return null;
    }

    if (url.protocol === "http:" && !isLocalHttpOrigin(url)) {
      return null;
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function parseOriginList(value: string | undefined) {
  const seen = new Set<string>();
  const origins: string[] = [];

  for (const item of value?.split(",") ?? []) {
    const origin = normalizeOrigin(item);

    if (origin && !seen.has(origin)) {
      seen.add(origin);
      origins.push(origin);
    }
  }

  return origins;
}

export function getTrustedPreviewOrigins() {
  return parseOriginList(process.env.PREVIEW_TRUSTED_ORIGINS);
}

export function getAuthTrustedOrigins() {
  return [...LOCAL_TRUSTED_ORIGINS, ...PRODUCTION_TRUSTED_ORIGINS, ...getTrustedPreviewOrigins()];
}

export function isTrustedAppOrigin(origin: string | null | undefined) {
  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return false;
  }

  return getAuthTrustedOrigins().includes(normalizedOrigin);
}

export function normalizeTrustedAppUrlOrigin(value: string | null | undefined) {
  if (!value?.trim() || value.includes("*")) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    const origin = url.origin;

    return isTrustedAppOrigin(origin) ? origin : null;
  } catch {
    return null;
  }
}
