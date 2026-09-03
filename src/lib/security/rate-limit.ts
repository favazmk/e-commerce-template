/**
 * Best-effort request throttling for public endpoints.
 *
 * Scope and honesty about it: this is an in-process fixed-window counter. On a
 * serverless platform each instance keeps its own counter, so the effective
 * limit is `limit × instances`. That makes it a *defence-in-depth* layer, not a
 * perimeter — it stops the cheap, high-volume abuse (coupon-code brute forcing,
 * review spam, credential stuffing from one host) without a Redis dependency.
 * A store facing determined attack should additionally enable the platform WAF
 * (Vercel Firewall / Cloudflare) and Supabase's own auth rate limits.
 *
 * It deliberately does NOT replace any authorisation check. Rate limiting is
 * about volume; `requireAdmin()` and RLS remain the things that decide access.
 */

interface Bucket {
  count: number;
  /** Epoch ms at which this window expires. */
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Stop the map growing without bound on a long-lived instance. */
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still full of live windows: drop the oldest entries rather than grow.
  if (buckets.size >= MAX_TRACKED_KEYS) {
    const excess = buckets.size - Math.floor(MAX_TRACKED_KEYS * 0.9);
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= excess) break;
    }
  }
}

export interface RateLimitOptions {
  /** Logical bucket name, e.g. "reviews:create". Keeps limits independent. */
  name: string;
  /** Maximum requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Caller identity — usually the client IP, optionally plus a user id. */
  identifier: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets; suitable for a Retry-After header. */
  retryAfterSeconds: number;
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const key = `${options.name}:${options.identifier}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.limit - 1,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed: existing.count <= options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSeconds,
  };
}

/**
 * Best available client identifier for a request.
 *
 * `x-forwarded-for` is spoofable in general, but on Vercel/Cloudflare the edge
 * rewrites it, so the left-most entry is the real client. It is used only for
 * throttling — never for identity or authorisation, where a spoofed header
 * would be a vulnerability rather than an inconvenience.
 */
export function getClientIdentifier(request: Request): string {
  const headers = request.headers;
  const candidates = [
    headers.get("x-vercel-forwarded-for"),
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0],
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value;
  }
  return "unknown";
}

/** Standard 429 body/headers for a throttled request. */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please wait a moment and try again.",
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}

/**
 * Common presets, so limits are chosen deliberately rather than ad hoc.
 * Tuned to be invisible to a real shopper and painful to a script.
 */
export const RATE_LIMITS = {
  /** Sign-in / sign-up / password reset attempts. */
  auth: { limit: 10, windowMs: 15 * 60 * 1000 },
  /** Coupon validation — the classic code-guessing target. */
  coupon: { limit: 15, windowMs: 10 * 60 * 1000 },
  /** Review submission. */
  review: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Checkout / order creation. */
  checkout: { limit: 20, windowMs: 10 * 60 * 1000 },
  /** Guest order lookup by order number. */
  orderLookup: { limit: 12, windowMs: 10 * 60 * 1000 },
  /** General read-heavy public API. */
  publicRead: { limit: 120, windowMs: 60 * 1000 },
} as const;
