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
