# 🛡️ Enterprise E-Commerce Security Architecture

Security is implemented as a fundamental system constraint.

---

## 1. Zero-Trust Server Calculations

Clients are treated as untrusted runtime environments:
- Product prices, compare-at amounts, discounts, and inventory availability are always queried directly from PostgreSQL.
- Cart and checkout totals are recalculated on every request before order creation or payment authorization.

---

## 2. Cryptographic Payment Verification

- **Razorpay HMAC-SHA256**: Signatures sent to `/api/payments/razorpay/verify` are hashed server-side using the secret key before order capture.
- **Webhook Authenticity**: Webhooks from `/api/payments/webhook` require matching header signatures before processing asynchronous events.

---

## 3. Database Security & Row Level Security (RLS)

`NEXT_PUBLIC_SUPABASE_ANON_KEY` ships in the browser bundle by design, so every visitor holds it.
Any table without RLS is therefore world-readable (and usually writable) through PostgREST no matter
what the application code does. RLS is the boundary, not the service layer.

- **RLS enabled on every table.** Customer-owned data (`users`, `addresses`, `carts`, `cart_items`,
  `orders`, `order_items`, `wishlists`) is scoped to `auth.uid()`.
- **Commercially sensitive tables carry no anon policy at all**, so the public key can reach nothing in
  them: `payments`, `refunds`, `coupons`, `coupon_usages`, `inventory_transactions`,
  `order_status_history`, `processed_webhooks`. Customers may read the payment rows and status history
  belonging to their own orders, and nothing else.
- **Public catalog stays public**: `products` (active only), `categories`, `product_images`,
  `product_variants`, `homepage_sections` and approved `reviews` remain readable. Draft and archived
  products are not.
- **Every service-role query is justified in code.** Repositories extend `SupabaseRepository`
  (`src/repositories/supabase/base.repository.ts`) and must call `serviceClient(reason)` with one of a
  fixed set of reasons — `system-no-session`, `admin-authorised`, `public-catalog-cached`,
  `guest-capability-token`, `no-anon-policy-by-design` — so each RLS bypass is a deliberate, greppable
  decision rather than a silent default. Reads of a customer's own profile and order history use
  `userClient()`, which is RLS-enforced and never falls back to the service role.
- **Guest order receipts** cannot be expressed in RLS (`user_id` is null, so `auth.uid() = user_id` is
  never true). The order number is the capability instead, generated from a CSPRNG, and
  `OrderService.getOrderForViewer()` enforces ownership for any order that does belong to an account.
- **Role Enforcement**: Admin endpoints and dashboard controls enforce roles (`admin`, `super_admin`)
  server-side via `requireAdmin()`.

Verify the deployed database actually matches this — a migration file proves nothing until it is
applied:

```bash
npx vitest run tests/integration/rls-hardening.test.ts
```

---

## 4. Race Condition & Overselling Prevention

- Atomic inventory deductions use PostgreSQL stored procedures with `FOR UPDATE` row locks.
- Every inventory alteration generates an immutable audit record in `inventory_transactions`.
