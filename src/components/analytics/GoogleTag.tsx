import Script from "next/script";

const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim();

export function GoogleTag() {
  if (!googleTagId) {
    return null;
  }

  const encodedTagId = encodeURIComponent(googleTagId);
  const serializedTagId = JSON.stringify(googleTagId);

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
          __html: `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());
window.gtag('config', ${serializedTagId});
          `.trim(),
        }}
      />
    </>
  );
}
