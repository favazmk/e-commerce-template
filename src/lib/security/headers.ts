/**
 * Response security headers, including Content Security Policy.
 *
 * ## Why the CSP allows 'unsafe-inline' for scripts
 *
 * The strictest CSP uses a per-request nonce. In the Next.js App Router a nonce
 * forces every page to render dynamically, which would switch off static
 * generation and ISR for the entire catalog — the thing that makes product
 * pages fast and cheap. For a storefront that is a bad trade.
 *
 * So this policy accepts `'unsafe-inline'` for scripts and instead locks down
 * every channel an injected script would need in order to be *useful*:
 *
 *   - `connect-src`  — an injected script cannot POST stolen card data or
 *                      session tokens to an attacker's domain.
 *   - `form-action`  — a swapped form `action` cannot submit anywhere else.
 *   - `frame-ancestors` — the checkout cannot be framed for clickjacking.
 *   - `base-uri`     — an injected `<base>` cannot re-point every relative URL.
 *   - `object-src`   — no Flash/plugin execution vectors.
 *   - `img-src`      — images cannot be used as an exfiltration beacon to an
 *                      arbitrary host.
 *
 * That is meaningful defence in depth. It is not a substitute for not having
 * XSS: React escaping, the JSON-LD serialiser and server-side validation are
 * what prevent injection in the first place.
 *
 * Set `CSP_MODE=report-only` while verifying a new integration, then switch to
 * `enforce` (the default).
 */

/** Hosts the storefront legitimately talks to, by directive. */
interface CspSources {
  script: string[];
  connect: string[];
  frame: string[];
  img: string[];
  style: string[];
  font: string[];
}

function collectSources(): CspSources {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const sources: CspSources = {
    script: ["'self'", "'unsafe-inline'"],
    connect: ["'self'"],
    frame: ["'self'"],
    img: ["'self'", "data:", "blob:"],
    style: ["'self'", "'unsafe-inline'"],
    font: ["'self'", "data:"],
  };

  // Supabase: database, auth and storage all run against the project URL.
  if (supabaseUrl) {
    sources.connect.push(supabaseUrl, supabaseUrl.replace(/^https:/, "wss:"));
    sources.img.push(supabaseUrl);
  }

  // Razorpay's hosted checkout injects an iframe and calls its own API.
  if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    sources.script.push("https://checkout.razorpay.com");
    sources.connect.push("https://api.razorpay.com", "https://lumberjack.razorpay.com");
    sources.frame.push("https://api.razorpay.com", "https://checkout.razorpay.com");
  }

  // Google Analytics / Ads / Tag Manager.
  if (
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
    process.env.NEXT_PUBLIC_GTM_ID
  ) {
    sources.script.push(
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://googleads.g.doubleclick.net",
      "https://www.googleadservices.com"
    );
    sources.connect.push(
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://stats.g.doubleclick.net",
      "https://www.googletagmanager.com",
      "https://region1.google-analytics.com"
    );
    sources.img.push(
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://www.google.com",
      "https://googleads.g.doubleclick.net"
    );
    sources.frame.push("https://td.doubleclick.net", "https://www.googletagmanager.com");
  }

  // Meta Pixel.
  if (process.env.NEXT_PUBLIC_META_PIXEL_ID) {
    sources.script.push("https://connect.facebook.net");
    sources.connect.push("https://www.facebook.com");
    sources.img.push("https://www.facebook.com");
  }

  // Google Fonts, loaded by globals.css.
  sources.style.push("https://fonts.googleapis.com");
  sources.font.push("https://fonts.gstatic.com");

  // Remote image hosts configured for next/image.
  sources.img.push("https://images.unsplash.com", "https://placehold.co", "https://*.supabase.co");

  // Any extra hosts a client store needs, e.g. a review widget or live chat.
  const extraScript = process.env.CSP_EXTRA_SCRIPT_SRC?.split(",").map((s) => s.trim()).filter(Boolean);
  const extraConnect = process.env.CSP_EXTRA_CONNECT_SRC?.split(",").map((s) => s.trim()).filter(Boolean);
  const extraImg = process.env.CSP_EXTRA_IMG_SRC?.split(",").map((s) => s.trim()).filter(Boolean);
  const extraFrame = process.env.CSP_EXTRA_FRAME_SRC?.split(",").map((s) => s.trim()).filter(Boolean);

  if (extraScript?.length) sources.script.push(...extraScript);
  if (extraConnect?.length) sources.connect.push(...extraConnect);
  if (extraImg?.length) sources.img.push(...extraImg);
  if (extraFrame?.length) sources.frame.push(...extraFrame);

  return sources;
}

function unique(values: string[]): string {
  return [...new Set(values)].join(" ");
}

export function buildContentSecurityPolicy(): string {
  const sources = collectSources();
  const isProduction = process.env.NODE_ENV === "production";

  const directives: string[] = [
    `default-src 'self'`,
    `script-src ${unique(sources.script)}${isProduction ? "" : " 'unsafe-eval'"}`,
    `style-src ${unique(sources.style)}`,
    `img-src ${unique(sources.img)}`,
    `font-src ${unique(sources.font)}`,
    `connect-src ${unique(sources.connect)}`,
    `frame-src ${unique(sources.frame)}`,
    // Clickjacking protection. Supersedes X-Frame-Options in modern browsers.
    `frame-ancestors 'none'`,
    // An injected <base> would silently re-point every relative URL on the page.
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `manifest-src 'self'`,
    `media-src 'self' data: blob:`,
    // Never let an http:// subresource downgrade the page.
    `upgrade-insecure-requests`,
  ];

  return directives.join("; ");
}

export interface SecurityHeaderOptions {
  /** Set true for API responses, which need no CSP but must not be cached. */
  isApi?: boolean;
}

/**
 * The full header set applied to every response.
 *
 * Returned as a plain record so it can be applied to a NextResponse, a Response
 * or asserted against in a test.
 */
export function securityHeaders(options: SecurityHeaderOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-DNS-Prefetch-Control": "off",
    // Deny hardware access the storefront never uses, and switch off FLoC.
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=(self)",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
    ].join(", "),
    // Isolate the browsing context so cross-origin windows cannot poke at it.
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
  };

  if (process.env.NODE_ENV === "production") {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  const cspMode = (process.env.CSP_MODE || "enforce").toLowerCase();
  if (cspMode !== "off") {
    const policy = buildContentSecurityPolicy();
    headers[
      cspMode === "report-only" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy"
    ] = policy;
  }

  if (options.isApi) {
    // API responses can carry personal data; keep them out of shared caches.
    headers["Cache-Control"] = "no-store, max-age=0";
  }

  return headers;
}
