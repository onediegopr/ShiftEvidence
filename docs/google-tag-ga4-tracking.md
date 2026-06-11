# Google Tag / GA4 Base Tracking

## Status

Shift Evidence includes a base Google tag integration for GA4 measurement and the Google Ads base tag.

This is not Google Ads conversion tracking. It does not configure Ads conversion IDs, conversion labels, remarketing audiences, bidding goals, campaigns, billing, Stripe, Wise, or pricing.

## Environment variable

Set these public environment variables where the website is built:

```env
NEXT_PUBLIC_GOOGLE_TAG_ID=G-MD8E3EXN4R
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-6946915593
```

When one or both direct tag IDs are present, the app renders the direct `gtag.js` installation and configures each ID once.

If those direct tag variables are missing, the component can still fall back to `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` when a GTM container is intentionally used.

## Runtime installation

The tag is installed once in the root App Router layout:

```text
src/app/layout.tsx
src/components/analytics/GoogleTag.tsx
```

The component uses `next/script` with `afterInteractive` for both:

- `https://www.googletagmanager.com/gtag/js`
- the base `gtag('config', 'G-MD8E3EXN4R')` call
- the base `gtag('config', 'AW-6946915593')` call

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
NEXT_PUBLIC_GOOGLE_ADS_START_ASSESSMENT_SEND_TO=AW-6946915593/REPLACE_WITH_CONVERSION_LABEL
NEXT_PUBLIC_GOOGLE_ADS_START_ASSESSMENT_VALUE=1.0
NEXT_PUBLIC_GOOGLE_ADS_START_ASSESSMENT_CURRENCY=ARS
```

The emitted event matches the Google Ads snippet:

```js
gtag("event", "conversion", {
  send_to: "AW-6946915593/REPLACE_WITH_CONVERSION_LABEL",
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
Do not reuse the Ads account ID alone as a conversion label. Google Ads conversions still need the full `AW-.../...` `send_to` value.
