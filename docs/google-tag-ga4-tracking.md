# Google Tag / GA4 Base Tracking

## Status

Shift Evidence includes a base Google tag integration for GA4 measurement.

This is not Google Ads conversion tracking. It does not configure Ads conversion IDs, conversion labels, remarketing audiences, bidding goals, campaigns, billing, Stripe, Wise, or pricing.

## Environment variable

Set this public environment variable where the website is built:

```env
NEXT_PUBLIC_GOOGLE_TAG_ID=G-MD8E3EXN4R
```

If the variable is missing or empty, the tag component renders nothing and the build continues normally.

## Runtime installation

The tag is installed once in the root App Router layout:

```text
src/app/layout.tsx
src/components/analytics/GoogleTag.tsx
```

The component uses `next/script` with `afterInteractive` for both:

- `https://www.googletagmanager.com/gtag/js`
- the base `gtag('config', measurementId)` call

## Event helper

Optional GA4 event helpers live in:

```text
src/lib/analytics.ts
```

Available helpers:

- `trackEvent`
- `trackLead`
- `trackSampleReportDownload`
- `trackPricingClick`
- `trackStartAssessmentConversion`

These helpers are safe client-side wrappers around `window.gtag` and no-op during SSR or when the tag has not loaded.

## Google Ads start assessment conversion

The Start Assessment conversion fires only after a successful account creation on `/sign-up`.

It does not fire on generic page view, `/start` redirect, or ordinary visits to `/sign-up`.

Configure it with public build-time variables:

```env
NEXT_PUBLIC_GOOGLE_ADS_START_ASSESSMENT_SEND_TO=AW-16907601641/5DFjCLyvi7scEOmNlv4-
NEXT_PUBLIC_GOOGLE_ADS_START_ASSESSMENT_VALUE=1.0
NEXT_PUBLIC_GOOGLE_ADS_START_ASSESSMENT_CURRENCY=ARS
```

The emitted event matches the Google Ads snippet:

```js
gtag("event", "conversion", {
  send_to: "AW-16907601641/5DFjCLyvi7scEOmNlv4-",
  value: 1.0,
  currency: "ARS",
});
```

## What remains for Google Ads conversion tracking

Additional Google Ads conversion tracking still requires:

- Conversion labels per additional action
- A consent/privacy decision
- Explicit event mapping for actions such as lead submit, sample download, pricing intent, or checkout start
- Validation in Google Tag Assistant / GA4 DebugView

Do not reuse this base GA4 measurement ID as an Ads conversion label.
