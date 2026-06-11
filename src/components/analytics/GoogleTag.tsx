import Script from "next/script";

const googleTagManagerId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?.trim();
const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim();
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();

export function GoogleTag() {
  if (googleTagId || googleAdsId) {
    const primaryTagId = googleTagId || googleAdsId;
    if (!primaryTagId) {
      return null;
    }
    const encodedTagId = encodeURIComponent(primaryTagId);
    const configTargets = [googleTagId, googleAdsId].filter(
      (value, index, array): value is string => Boolean(value) && array.indexOf(value) === index,
    );
    const configScript = [
      "window.dataLayer = window.dataLayer || [];",
      "window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};",
      "window.gtag('js', new Date());",
      ...configTargets.map((tagId) => `window.gtag('config', ${JSON.stringify(tagId)});`),
    ].join("\n");

    return (
      <>
        <Script
          id="google-tag-loader"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodedTagId}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-tag-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: configScript,
          }}
        />
      </>
    );
  }

  if (googleTagManagerId) {
    const serializedGtmId = JSON.stringify(googleTagManagerId);

    return (
      <>
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+${serializedGtmId}+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${serializedGtmId});
            `.trim(),
          }}
        />
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      </>
    );
  }

  return null;
}
