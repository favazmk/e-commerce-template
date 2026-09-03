import { describe, expect, it } from "vitest";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from "../src/lib/security/rate-limit";

/**
 * Throttling for public endpoints.
 *
 * This is defence in depth, not a perimeter — see the note at the top of
 * rate-limit.ts. What these tests protect is that the counter is per-bucket and
 * per-caller, which is the property that makes it useful at all: a shared
 * counter would let one abusive client lock out every other shopper.
 */
describe("checkRateLimit", () => {
  const options = { limit: 3, windowMs: 60_000 };

  it("allows requests up to the limit and blocks the next one", () => {
    const identifier = `caller-${Math.random()}`;

    expect(checkRateLimit({ name: "test", identifier, ...options }).allowed).toBe(true);
    expect(checkRateLimit({ name: "test", identifier, ...options }).allowed).toBe(true);
    expect(checkRateLimit({ name: "test", identifier, ...options }).allowed).toBe(true);

    const blocked = checkRateLimit({ name: "test", identifier, ...options });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts each caller separately", () => {
    // Otherwise one abusive IP would lock out every other shopper.
    const noisy = `noisy-${Math.random()}`;
    const quiet = `quiet-${Math.random()}`;

    for (let attempt = 0; attempt < 5; attempt++) {
      checkRateLimit({ name: "shared", identifier: noisy, ...options });
    }

    expect(checkRateLimit({ name: "shared", identifier: quiet, ...options }).allowed).toBe(true);
  });

  it("counts each bucket separately", () => {
    // Exhausting coupon validation must not also block adding to the cart.
    const identifier = `caller-${Math.random()}`;

    for (let attempt = 0; attempt < 5; attempt++) {
      checkRateLimit({ name: "bucket-a", identifier, ...options });
    }

    expect(checkRateLimit({ name: "bucket-b", identifier, ...options }).allowed).toBe(true);
  });

  it("resets once the window has passed", async () => {
    const identifier = `caller-${Math.random()}`;
    // Long enough that the two synchronous calls below cannot straddle the
    // boundary on a slow machine, short enough not to pad the suite.
    const shortWindow = { limit: 1, windowMs: 60 };

    expect(checkRateLimit({ name: "expiry", identifier, ...shortWindow }).allowed).toBe(true);
    expect(checkRateLimit({ name: "expiry", identifier, ...shortWindow }).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 90));

    expect(checkRateLimit({ name: "expiry", identifier, ...shortWindow }).allowed).toBe(true);
  });
});

describe("getClientIdentifier", () => {
  it("prefers the platform-provided header over the spoofable one", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        "x-vercel-forwarded-for": "9.9.9.9",
      },
    });

    expect(getClientIdentifier(request)).toBe("9.9.9.9");
  });

  it("takes the left-most entry of x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });

    expect(getClientIdentifier(request)).toBe("1.2.3.4");
  });

  it("degrades to a constant rather than throwing when no header is present", () => {
    // Everyone shares one bucket in that case, which is restrictive but safe.
    expect(getClientIdentifier(new Request("https://example.com"))).toBe("unknown");
  });
});

describe("rateLimitResponse", () => {
  it("returns 429 with a Retry-After header", async () => {
    const response = rateLimitResponse({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");

    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMITED");
  });
});
