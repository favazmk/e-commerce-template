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

### RLS restricts rows, not columns — and that distinction was a full compromise

Row Level Security decides **which rows** a statement may touch. It cannot restrict **which columns**.
The initial schema shipped:

```sql
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
```

With no `WITH CHECK`, Postgres reuses the `USING` expression — which only asserts that the row still
belongs to the caller. It says nothing about `role`. So any registered customer could open the
browser console and run:

```
PATCH /rest/v1/users?id=eq.<their own id>
Authorization: Bearer <their own session JWT>
{ "role": "super_admin" }
```

From that moment `getSessionUser()` reported them as an administrator: `requireAdmin()` passed, the
middleware role check passed, and the entire admin panel — orders, customers, settings, payouts —
was open. This was reproduced against a live database before being fixed.

`supabase/migrations/20260105000000_privilege_escalation_fix.sql` closes it with three independent
layers:

1. **Column privileges** — `authenticated` holds `UPDATE` on `name`, `phone`, `avatar_url` only.
2. **A `BEFORE UPDATE` trigger** — `guard_user_privileged_columns()` pins `role`, `id`, `email` and
   `created_at` for any non-service-role caller. This survives a future migration carelessly
   re-granting table-wide `UPDATE`.
3. **Server-side validation** — the profile Zod schema has no `role` field at all.

The same migration adds the missing `WITH CHECK` clauses to `addresses`, `wishlists`, `carts` and
`cart_items` (a `FOR ALL USING` policy does not constrain `INSERT`, so a customer could insert rows
owned by somebody else), stops an approved review being silently rewritten after moderation,
narrows `store_settings` from `USING (true)` to a fixed key allowlist, and ties `product_images`
visibility to the parent product so draft imagery stops leaking.

### Verify the deployed database, do not assume it

A migration file protects nothing until it has been applied. The most dangerous failure mode of this
template is a client store deployed from a checkout where `supabase db push` was never run: the admin
panel looks right, the storefront works, the local tests pass, and any registered customer can make
themselves an administrator.

One command settles it:

```bash
npm run verify:security
```

It signs in as a throwaway customer and *performs the attacks* against whatever database is in
`.env.local` — self-promotion to `super_admin`, writing an address owned by somebody else, reading
payments and coupons with the public browser key — then exits non-zero if any of them succeed. It
cleans up the probe user afterwards and never touches real customer data.

Run it for **every client database**, not just this one, and again after any migration.

The same assertions run as part of the test suite:

```bash
npx vitest run tests/integration/rls-hardening.test.ts
```
```bash
npx vitest run tests/integration/privilege-escalation.test.ts
```

---

## 4. Race Condition & Overselling Prevention

- Atomic inventory deductions use PostgreSQL stored procedures with `FOR UPDATE` row locks.
- Every inventory alteration generates an immutable audit record in `inventory_transactions`.

---

## 8. Response Headers & Content Security Policy

Set for every response in `src/middleware.ts` from `src/lib/security/headers.ts`.

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Restricts where scripts, images, connections and frames may come from |
| `Strict-Transport-Security` | Forces HTTPS for two years (production only) |
| `X-Content-Type-Options` | Stops MIME sniffing |
| `X-Frame-Options` + `frame-ancestors 'none'` | Clickjacking protection on the checkout |
| `Referrer-Policy` | Stops full URLs leaking to third parties |
| `Permissions-Policy` | Denies camera, microphone, geolocation, USB and FLoC |
| `Cross-Origin-Opener-Policy` | Isolates the browsing context |
| `Cache-Control: no-store` | On API responses, which can carry personal data |

### Why the CSP allows `'unsafe-inline'` for scripts

The strictest CSP uses a per-request nonce. In the Next.js App Router a nonce
forces every page to render dynamically, which switches off static generation
and ISR for the whole catalog — the thing that makes product pages fast and
cheap to serve. For a storefront that is a bad trade.

So the policy accepts inline scripts and instead locks down every channel an
injected script would need in order to be *useful*:

- `connect-src` — cannot POST stolen data to an attacker's domain
- `form-action` — a swapped form `action` cannot submit elsewhere
- `frame-ancestors` — the checkout cannot be framed
- `base-uri` — an injected `<base>` cannot re-point every relative URL
- `object-src` — no plugin execution vectors
- `img-src` — images cannot be used as an exfiltration beacon

That is meaningful defence in depth. It is **not** a substitute for not having
XSS: React escaping, the JSON-LD serialiser (`serializeJsonLd`) and server-side
validation are what prevent injection in the first place.

Allowed origins are derived from configuration, so a store with no Razorpay key
never allows Razorpay, and a store with no analytics never allows Google. Extra
hosts for a live-chat or review widget go in `CSP_EXTRA_SCRIPT_SRC` and friends.

Use `CSP_MODE=report-only` while adding a new third-party widget, check the
browser console for violations, then switch back to `enforce`.

---

## 9. Structured Data Injection

Product names and review text are merchant- and customer-supplied, and they end
up inside `<script type="application/ld+json">`. That element's content is raw
text to the HTML tokeniser, so an unescaped `</script>` closes the tag early and
everything after it becomes live markup — stored XSS on every product page,
reachable by anyone who can submit a review.

`serializeJsonLd()` in `src/components/seo/JsonLd.tsx` escapes `<`, `>`, `&`,
U+2028 and U+2029 as unicode sequences. Covered by `tests/seo.test.ts`, which
caught a real regression where the escape sequences had been collapsed into
no-ops by a formatting pass.

---

## 10. Rate Limiting

`src/lib/security/rate-limit.ts` throttles public write endpoints — coupon
validation, review submission, back-in-stock, newsletter, order tracking.

Be honest about its scope: it is an in-process fixed-window counter, so on
serverless each instance keeps its own and the effective limit is
`limit × instances`. It stops cheap, high-volume abuse (coupon brute-forcing,
review spam, mail-bombing through the back-in-stock form) without adding a Redis
dependency. A store under determined attack should also enable Vercel Firewall
or Cloudflare.

It never replaces an authorisation check. `requireAdmin()` and RLS decide access;
rate limiting only decides volume.

---

## 11. Open Redirect Protection

`?redirectTo=` on the login flow is attacker-controlled. `safeRedirectPath()`
(`src/lib/security/safe-redirect.ts`) accepts only same-origin, single-leading-
slash paths, and rejects protocol-relative URLs, backslash normalisation tricks,
percent-encoded schemes and control characters.

Without it, `https://real-store.com/login?redirectTo=https://evil.example` is a
phishing page on your own domain: the victim sees a URL they trust for the
entire time they are typing their password.

Covered by `tests/safe-redirect.test.ts`.
