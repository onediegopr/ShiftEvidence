function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function normalizePath(path = "/") {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getPublicAppUrl() {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
  );
}

export function getPublicUrl(path = "/") {
  return new URL(normalizePath(path), `${getPublicAppUrl()}/`);
}
