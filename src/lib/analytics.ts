type GoogleTagCommand = "config" | "event" | "js" | "set";
type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: GoogleTagCommand, target: string | Date, params?: AnalyticsParams) => void;
  }
}

function compactParams(params: AnalyticsParams) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, compactParams(params));
}

export function trackLead(source = "website", params: AnalyticsParams = {}) {
  trackEvent("generate_lead", {
    source,
    ...params,
  });
}

export function trackSampleReportDownload(params: AnalyticsParams = {}) {
  trackEvent("sample_report_download", params);
}

export function trackPricingClick(plan?: string, params: AnalyticsParams = {}) {
  trackEvent("pricing_click", {
    plan,
    ...params,
  });
}

export {};
