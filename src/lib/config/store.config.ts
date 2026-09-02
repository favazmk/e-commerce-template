/**
 * Store-level configuration for the reusable template.
 *
 * Everything here is client-configurable via environment variables so that the
 * MASTER repository stays generic (see AGENTS.md sections 1, 9 and 25).
 * Never hard-code a client's name, domain, colours or currency in this file —
 * change the environment, not the template.
 */

const FALLBACK_STORE_NAME = "Your Store";
const FALLBACK_CHECKOUT_COLOR = "#0f172a";
const FALLBACK_CURRENCY = "AED";
const FALLBACK_CURRENCY_SYMBOL = "AED";
const FALLBACK_ORDER_PREFIX = "ORD";

/** Public storefront / gateway display name. */
export function getStoreDisplayName(): string {
  return process.env.NEXT_PUBLIC_STORE_NAME?.trim() || FALLBACK_STORE_NAME;
}

/** Short tagline rendered under the wordmark. Optional by design. */
export function getStoreTagline(): string | undefined {
  return process.env.NEXT_PUBLIC_STORE_TAGLINE?.trim() || undefined;
}

/** Accent colour handed to hosted payment gateway widgets. */
export function getCheckoutThemeColor(): string {
  return process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR?.trim() || FALLBACK_CHECKOUT_COLOR;
}

/** ISO 4217 currency code used for order and payment records. */
export function getDefaultCurrency(): string {
  return (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY?.trim() || FALLBACK_CURRENCY).toUpperCase();
}

/** Symbol used when formatting prices for display. */
export function getCurrencySymbol(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL?.trim() || FALLBACK_CURRENCY_SYMBOL;
}

/**
 * Currency marker for form field labels, e.g. "Selling Price (AED)".
 *
 * Labels must never hard-code a symbol: the same form ships to every client,
 * and the currency is environment-driven.
 */
export function getCurrencyLabel(): string {
  return getCurrencySymbol() || getDefaultCurrency();
}

/** Prefix applied to generated human-readable order numbers. */
export function getOrderNumberPrefix(): string {
  const raw = process.env.ORDER_NUMBER_PREFIX?.trim() || FALLBACK_ORDER_PREFIX;
  // Keep the prefix URL- and receipt-safe.
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || FALLBACK_ORDER_PREFIX;
}

/** Canonical site origin, used for metadata and absolute links. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}

/**
 * Demo mode is opt-in. It exists for previews and design review only and must
 * never be inferred from missing production credentials (AGENTS.md 5 and 6).
 */
export function isDemoMode(): boolean {
  return process.env.APP_MODE === "demo";
}

/**
 * Format a monetary amount for display using the configured currency.
 * Falls back to a symbol-prefixed fixed-decimal string when Intl is
 * unavailable or the currency code is not recognised.
 */
export function formatPrice(amount: number, currency: string = getDefaultCurrency()): string {
  const value = Number(amount);
  const safeValue = Number.isFinite(value) ? value : 0;

  try {
    return new Intl.NumberFormat(process.env.NEXT_PUBLIC_LOCALE || "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    // A multi-letter marker such as "AED" reads wrong glued to the digits.
    const symbol = getCurrencySymbol();
    const separator = /[A-Za-z]$/.test(symbol) ? " " : "";
    return `${symbol}${separator}${safeValue.toFixed(2)}`;
  }
}
