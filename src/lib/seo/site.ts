/**
 * Canonical site identity used by metadata, structured data, feeds and sitemaps.
 *
 * Every value is environment-driven so the MASTER template never carries a
 * client's domain, phone number or social handles (AGENTS.md sections 9, 25).
 */

import { getSiteUrl, getStoreDisplayName } from "@/lib/config/store.config";

/** Join a path onto the configured origin, producing an absolute URL. */
export function absoluteUrl(path = "/"): string {
  const origin = getSiteUrl().replace(/\/+$/, "");
  if (!path || path === "/") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Canonical URL for a route.
 *
 * Query strings are deliberately dropped: `?page=2&sort=price_asc` variants of
 * a listing are the classic duplicate-content trap, and a canonical pointing at
 * the clean path is what consolidates ranking signals onto one URL.
 */
export function canonicalUrl(path = "/"): string {
  return absoluteUrl(path.split("?")[0]);
}

/** Split a comma-separated env value into a clean list. */
function list(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export interface StoreContact {
  email?: string;
  phone?: string;
  whatsapp?: string;
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
  /** Absolute profile URLs used for the `sameAs` structured-data property. */
  socialProfiles: string[];
}

/**
 * Merchant contact details. All optional: a store that has not filled these in
 * simply emits less structured data rather than emitting placeholders, because
 * a fake address in schema.org markup is a manual-action risk with Google.
 */
export function getStoreContact(): StoreContact {
  return {
    email: process.env.NEXT_PUBLIC_STORE_EMAIL?.trim() || undefined,
    phone: process.env.NEXT_PUBLIC_STORE_PHONE?.trim() || undefined,
    whatsapp: process.env.NEXT_PUBLIC_STORE_WHATSAPP?.trim() || undefined,
    streetAddress: process.env.NEXT_PUBLIC_STORE_STREET?.trim() || undefined,
    addressLocality: process.env.NEXT_PUBLIC_STORE_CITY?.trim() || undefined,
    addressRegion: process.env.NEXT_PUBLIC_STORE_REGION?.trim() || undefined,
    postalCode: process.env.NEXT_PUBLIC_STORE_POSTAL_CODE?.trim() || undefined,
    addressCountry: process.env.NEXT_PUBLIC_STORE_COUNTRY?.trim() || undefined,
    socialProfiles: list(process.env.NEXT_PUBLIC_SOCIAL_PROFILES),
  };
}

/** Logo used by Organization structured data and the PWA manifest. */
export function getLogoUrl(): string {
  const configured = process.env.NEXT_PUBLIC_STORE_LOGO_URL?.trim();
  if (configured) {
    return configured.startsWith("http") ? configured : absoluteUrl(configured);
  }
  return absoluteUrl("/logo.svg");
}

/** Short store description reused across metadata and structured data. */
export function getStoreDescription(): string {
  return (
    process.env.NEXT_PUBLIC_STORE_DESCRIPTION?.trim() ||
    process.env.NEXT_PUBLIC_STORE_TAGLINE?.trim() ||
    `Shop the latest products at ${getStoreDisplayName()}.`
  );
}

/**
 * Whether this deployment may be indexed.
 *
 * Preview and demo deployments must stay out of the index — a staging copy
 * ranking alongside the live store splits traffic and leaks unfinished content.
 */
export function isIndexable(): boolean {
  if (process.env.NEXT_PUBLIC_APP_MODE === "demo") return false;
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === "false") return false;
  // Vercel preview deployments report "preview"; only production is indexable.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return false;
  return true;
}

/** Search-console style verification tokens, when the client has them. */
export function getVerificationTokens() {
  return {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined,
    bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim() || undefined,
    pinterest: process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION?.trim() || undefined,
  };
}
