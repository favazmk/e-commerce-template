"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

/**
 * Measurement tags: Google Consent Mode v2, GA4, Google Ads and Meta Pixel.
 *
 * Order matters and is not negotiable: the consent defaults must reach
 * `dataLayer` BEFORE the Google tag loads, or the tag fires once under implicit
 * consent and that hit cannot be retracted. They are therefore emitted as a
 * synchronous head script by <ConsentDefaults /> in the root layout, and this
 * component only loads the tags themselves.
 *
 * Everything is opt-in by configuration: with no measurement IDs set, this
 * component renders nothing and the storefront makes no third-party requests.
 */

function PageViewTracker({ measurementIds }: { measurementIds: string[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // App Router navigations do not reload the page, so the tag's automatic
  // page_view only ever fires once. Without this, every route after the
  // landing page is invisible in GA4.
  useEffect(() => {
    if (measurementIds.length === 0) return;

    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== "function") return;

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    for (const id of measurementIds) {
      gtag("config", id, { page_path: path });
    }
  }, [pathname, searchParams, measurementIds]);

  return null;
}

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  const googleIds = [gaId, adsId].filter(Boolean) as string[];
  const hasGoogle = googleIds.length > 0 || Boolean(gtmId);

  if (!hasGoogle && !pixelId) return null;

  return (
    <>
      {hasGoogle && (
        <>
          {/* Consent defaults are emitted by <ConsentDefaults /> in the root
              layout head — they must run before any tag loads, which a
              component-level script cannot guarantee in the App Router. */}
          {gtmId ? (
            <Script id="gtm" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `}
            </Script>
          ) : null}

          {googleIds.length > 0 && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${googleIds[0]}`}
                strategy="afterInteractive"
              />
              <Script id="gtag-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = window.gtag || gtag;
                  gtag('js', new Date());
                  ${googleIds
                    .map(
                      (id) =>
                        `gtag('config', '${id}', { send_page_view: true, anonymize_ip: true });`
                    )
                    .join("\n                  ")}
                `}
              </Script>
            </>
          )}

          <Suspense fallback={null}>
            <PageViewTracker measurementIds={googleIds} />
          </Suspense>
        </>
      )}

      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('consent', 'revoke');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* GTM noscript fallback, required for the container to be considered
          correctly installed. */}
      {gtmId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      )}
    </>
  );
}
