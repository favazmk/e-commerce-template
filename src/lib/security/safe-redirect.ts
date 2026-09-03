/**
 * Validate a caller-supplied post-login destination.
 *
 * `?redirectTo=` is attacker-controlled. Passing it straight to
 * `window.location` or `NextResponse.redirect` is an open redirect: a phishing
 * link of the form `https://real-store.com/login?redirectTo=https://evil.example`
 * shows the genuine store in the address bar, takes the customer's password on
 * the real domain, then bounces them somewhere hostile. The customer sees a URL
 * they trust the whole way through, which is exactly what makes it effective.
 *
 * The rule enforced here: only same-origin, single-leading-slash paths.
 */

/** Paths a signed-in customer should never be bounced back to. */
const BLOCKED_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/"];

/**
 * Backslashes and control characters. Browsers normalise `\` to `/` in URLs, so
 * `/\evil.example` becomes `//evil.example` — a protocol-relative jump to
 * another origin that a naive `startsWith("/")` check waves through.
 */
const UNSAFE_PATH_CHARS = new RegExp("[" + "\\u0000-\\u001F" + "\\u007F" + "\\\\" + "]");

export function safeRedirectPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value) return fallback;

  const candidate = value.trim();

  // Must be a site-relative path.
  if (!candidate.startsWith("/")) return fallback;

  // "//evil.example" and "/\evil.example" are protocol-relative URLs that most
  // browsers resolve to a different origin despite the leading slash.
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;

  // A backslash or control character can be normalised by the browser into
  // something that escapes the origin.
  if (UNSAFE_PATH_CHARS.test(candidate)) return fallback;

  // Reject anything that parses as absolute (e.g. "/https://evil" is fine, but
  // a scheme sneaking through encoding is not).
  let decoded = candidate;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded.replace(/^\/+/, ""))) return fallback;

  const pathOnly = candidate.split("?")[0].split("#")[0];
  if (BLOCKED_PREFIXES.some((prefix) => pathOnly === prefix || pathOnly.startsWith(prefix))) {
    return fallback;
  }

  return candidate;
}
