import React from "react";

/**
 * Google Consent Mode v2 defaults.
 *
 * Rendered as a plain synchronous <script> in the document head, not through
 * next/script. `beforeInteractive` is unsupported outside pages/_document, and
 * the ordering guarantee is not optional here: if the Google tag loads before
 * these defaults are set, it fires one hit under implicit consent, and that
 * hit cannot be retracted.
 *
 * Everything starts denied. `wait_for_update` gives the consent banner two
 * seconds to answer before the tag proceeds with the denied defaults, which is
 * what makes consent-modelled conversion reporting work for visitors who never
 * click either button.
 */
export function ConsentDefaults() {
  const enabled = Boolean(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
      process.env.NEXT_PUBLIC_GTM_ID
  );

  if (!enabled) return null;

  // Static string with no interpolated values — nothing user-controlled reaches
  // this script, so there is no injection surface.
  const script = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 2000
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
`.trim();

  return <script id="consent-defaults" dangerouslySetInnerHTML={{ __html: script }} />;
}
