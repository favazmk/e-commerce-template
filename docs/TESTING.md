# 🧪 Automated Testing Strategy & Verification

The commerce platform includes comprehensive automated tests built on **Vitest**.

---

## 1. Test Categories

```text
tests/
├── cart.test.ts              # Price math, variant pricing, stock limits, cart merging
├── coupon.test.ts            # Percentage/fixed discounts, min spend, expiry, usage caps
├── tax-shipping.test.ts      # Inclusive/exclusive tax math, free shipping thresholds
├── inventory.test.ts         # Atomic stock decrements, overselling prevention, audit ledger
├── payment-security.test.ts  # Price tampering resistance, Razorpay HMAC signatures
└── order-lifecycle.test.ts   # Order placement, immutable item snapshots, status history
```

---

## 2. Running Automated Tests

```bash
# Run all test suites once
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 3. Core Assertions Tested
- **Price Tampering Protection**: Verifies that a client submitting altered prices (e.g. `$1.00`) cannot bypass server-side calculation.
- **HMAC Signature Verifications**: Verifies that forged Razorpay payment signatures are rejected with HTTP 400.
- **Atomic Stock Checks**: Validates that orders exceeding available inventory throw descriptive errors and prevent negative stock.
- **Coupon Caps**: Asserts that percentage discounts never exceed `max_discount_amount`.

---

## 4. End-to-End Tests (Playwright)

```bash
npx playwright test
```

The E2E suite builds the app in **demo mode** and starts its own server, so the
checkout specs can complete a purchase through the simulated gateway without a
live payment provider.

### If E2E tests fail in ways that look like application bugs

Two failure modes look like broken code but are not:

**1. `page.goto` times out, or browser contexts fail to close.**
Playwright's default is one worker per CPU core. These specs each drive a full
checkout against a hosted database, so the bottleneck is network and memory
rather than CPU, and the default oversubscribes a laptop badly enough that
browsers time out while *launching*. `playwright.config.ts` therefore pins
`workers` to 2 locally and 1 in CI. If you still see it on a constrained
machine, drop to one:

```bash
npx playwright test --workers=1
```

**2. The simulated payment option is missing, so checkout specs fail.**
`reuseExistingServer` means a server already listening on port 3000 is used
as-is. If you started one yourself with `npm run start` after a *normal* build,
it is not in demo mode and the mock gateway is not offered. Stop that server and
let Playwright build and start its own.

---

## 5. Security Verification

```bash
npm run verify:security
```

This is not a unit test. It signs in as a throwaway customer against the
database in your `.env.local` and **performs real attacks** — self-promotion to
`super_admin`, writing an address owned by another customer, reading payments
and coupons with the public browser key — then exits non-zero if any of them
succeed. It cleans up the probe user afterwards and never touches real customer
data.

Run it:

- before every go-live, for **every** client database;
- after applying any migration, since a schema change can silently drop a policy;
- quarterly against production credentials.

A migration file protects nothing until it has been applied, and a store with an
unapplied security migration looks completely normal from the outside. This
script is what tells you the difference.
