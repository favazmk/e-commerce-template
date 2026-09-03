# ⚡ Agency E-Commerce Starter — Reusable Multi-Client Commerce Engine

A modular, production-oriented e-commerce engine built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL / Supabase**.

This repository is the **MASTER template**. Client stores are created from it and customised through
configuration and the theme layer — not by editing the Commerce Core. See [AGENTS.md](agents.md) for the
rules that keep this repository generic.

![Storefront Preview](/public/assets/img/screenshot.png)

---

## 📖 Overview

The system enforces separation between:

| Layer | Responsibility | Location |
|-------|----------------|----------|
| **Commerce Core** | Orders, inventory, cart maths, tax, shipping, coupons, payment orchestration | `src/services/` |
| **Theme / Presentation** | Branding, tokens, layouts, product card variants, navigation | `src/theme/`, `src/components/storefront/` |
| **Providers** | Payment and email adapters behind stable interfaces | `src/lib/payments/`, `src/lib/email/` |
| **Repositories** | Data access behind interfaces; no queries in UI code | `src/repositories/` |

Everything client-specific — store name, tagline, colours, currency, order-number prefix, navigation —
is configuration. Nothing in this repository hard-codes a client identity.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.4 with CSS-variable design tokens
- **Database**: PostgreSQL / Supabase with Row Level Security and SQL migrations
- **Payments**: Razorpay adapter (implemented) + a simulated gateway for demo deployments
- **Email**: Resend (production) or a console logger (development)
- **Testing**: Vitest (unit + integration) and Playwright (E2E)
- **UI**: Lucide React icons, custom component primitives

---

## ✨ Capabilities

### Customer storefront
- **Database-driven homepage sections** — hero, featured products, categories, banners, testimonials, newsletter; ordered and toggled from `homepage_sections`.
- **Catalog & search** — debounced search, indexable category landing pages, price and brand facets derived from the live catalog, in-stock filter, windowed pagination.
- **Product detail** — multi-image gallery, variant axes with availability, delivery-date estimate, offers block, back-in-stock capture, sticky mobile buy bar.
- **Merchandising** — frequently bought together, similar products, cart companions, best sellers and recently viewed. See [CONVERSION.md](docs/CONVERSION.md).
- **Cart** — server-recalculated pricing and stock, marked-price savings breakdown, free-shipping progress, inline add of recommended items.
- **Checkout** — server-validated address, server-configured shipping methods, coupon engine, Razorpay modal.
- **Accounts** — registration, password reset, address book, profile, change email, sign out everywhere. See [ACCOUNTS.md](docs/ACCOUNTS.md).
- **Order tracking** — signed-in and guest (order number plus email), with a live status timeline.

### Merchant admin
- **Analytics overview** — revenue, order volume, AOV, low-stock alerts.
- **Product management** — variant matrix generator, media manager, SKU tracking.
- **Nested categories**, **inventory ledger** with an immutable `inventory_transactions` history.
- **Order lifecycle** — frozen price snapshots and status transitions.
- **Coupons** — percentage/fixed rules, minimum spend, discount caps, usage limits.
- **Store settings & homepage builder** — persisted to the database.

### Discoverability & marketing
- **Sitemap, robots and PWA manifest** generated from the live catalog.
- **schema.org markup** — Product, Breadcrumb, ItemList, Organization, WebSite with sitelinks search, FAQ.
- **Google Merchant Center feed** at `/feeds/google-merchant.xml` and a **Meta catalog feed** at `/feeds/meta-catalog.csv`.
- **GA4, Google Ads and Meta Pixel** with the full e-commerce event funnel and server-sourced purchase values.
- **Consent Mode v2** — tracking denied by default, granted only after an explicit choice.
- Preview and demo deployments are excluded from indexing automatically.

See [SEO.md](docs/SEO.md).

### Security model
- **Zero client trust** — prices, discounts, tax, and shipping are always recalculated server-side from
  the database; client-supplied amounts are ignored.
- **Session-derived identity** — user identity comes from the Supabase session cookie only. Request
  headers and JSON bodies are never trusted to identify a user.
- **Authorised writes** — every mutating API route is guarded by `requireAdmin()` in
  `src/lib/auth/session.ts`, independently of the route-matcher middleware.
- **Cryptographic payment verification** — HMAC-SHA256 signature checks with constant-time comparison.
  Verification **fails closed**: a missing key secret or webhook secret rejects the request rather
  than approving it. The verified gateway order id is bound to the order being settled, so a signature
  valid for one order cannot settle another.
- **Row Level Security** — enabled on every table; commercially sensitive tables (payments, refunds,
  coupons, coupon usage, inventory movements, webhook payloads) are unreachable with the public anon key.
- **Atomic stock reservation** — row locking prevents overselling under concurrency.
- **Column-level privilege enforcement** — `users.role` is unwritable through the public key, guarded
  by column grants, a database trigger and server-side validation independently. RLS restricts rows,
  not columns; that distinction was a full-compromise vulnerability until
  `20260105000000_privilege_escalation_fix.sql`.
- **Content Security Policy** — configuration-derived allowlists for scripts, connections, frames and
  images, plus `frame-ancestors`, `form-action` and `base-uri` locks.
- **Open-redirect protection** on every post-login destination.
- **Rate limiting** on public write endpoints (coupons, reviews, newsletter, order lookup).
- **Injection-safe structured data** — JSON-LD is escaped so merchant and customer text cannot break
  out of the script tag.
- **Baseline security headers** — set for every response in `src/middleware.ts`.

---

## 🚀 Local Setup

### 1. Clone and install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Fill in Supabase credentials and, for a real store, the Razorpay keys.
Every variable is documented inline in `.env.example`.

> **Demo mode**: setting `APP_MODE=demo` and `NEXT_PUBLIC_APP_MODE=demo` enables a simulated gateway
> that approves payments **without charging anything**. Use it for previews and design review only.
> It is never enabled implicitly — missing production credentials cause a clear failure, not a silent
> fallback.

### 3. Run migrations
```bash
supabase db push
```

> If `db push` reports *"Remote migration versions not found in local migrations directory"*, the
> remote's migration history diverges from this repo and pushing would try to reconcile it. To apply a
> single migration without touching that history, split it into statements and run them through the
> CLI (`supabase db query` sends one command at a time):
>
> ```bash
> node scripts/apply-sql-statements.mjs supabase/migrations/<file>.sql --split-to .tmp/stmts
> ```
>
> then apply each generated file with `supabase db query --db-url "$DATABASE_URL" -f <file>`.
> The RLS hardening migration is idempotent, so a partial run is safe to repeat.

### 4. Start the dev server
```bash
npm run dev
```
Storefront at `http://localhost:3000`, admin at `http://localhost:3000/admin`
(requires a user whose `users.role` is `admin` or `super_admin`).

---

## 🧪 Verification pipeline

Run all of these before declaring a change complete:

```bash
npm run lint
```
```bash
npx tsc --noEmit
```
```bash
npm run test
```
```bash
npm run build
```
```bash
npx playwright test
```
```bash
npm run verify:security
```

`npm run verify:security` is not a unit test — it signs in as a throwaway
customer and performs real privilege-escalation and data-exfiltration attacks
against the database in your `.env.local`, then exits non-zero if any of them
succeed. A migration file protects nothing until it has been applied, and a
store with an unapplied security migration looks completely normal until
somebody exploits it. Run it against **every** client database, not just this
one.

`npm run test` covers the unit and integration suites (integration tests hit a real database and are
included in the default run). The E2E suite builds the app with `APP_MODE=demo` so it can complete a
purchase without a live gateway — see `playwright.config.ts`.

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── (storefront)/         # Storefront routes (home, catalog, PDP, cart, checkout, account)
│   ├── admin/                # Merchant dashboard routes
│   └── api/                  # REST API routes and payment webhook handler
├── components/
│   ├── ui/                   # UI primitives (Button, Input, Modal, Drawer, Card, Badge)
│   └── storefront/           # Header, Footer, MiniCart, ProductCard, SearchModal, Analytics, sections
├── features/
│   ├── cart/                 # Cart context and state
│   └── wishlist/             # Wishlist state
├── lib/
│   ├── auth/                 # Session resolution and route guards
│   ├── config/               # Store configuration (name, currency, order prefix, demo mode)
│   ├── email/                # EmailProvider interface + Resend / console adapters
│   ├── hooks/                # Shared client hooks (focus trap)
│   ├── payments/             # PaymentProvider interface + Razorpay / simulated adapters
│   └── supabase/             # Browser, server, and service-role clients
├── repositories/
│   ├── interfaces/           # Repository contracts
│   └── supabase/             # Supabase implementations
├── services/                 # Commerce Core (product, cart, order, inventory, tax, shipping, coupon)
├── theme/                    # Theme config, provider, token injection
└── types/                    # Database and domain contracts
```

---

## 📚 Documentation

- 🚦 [**Go-Live Checklist**](docs/GO-LIVE.md) — start here for a new store
- 🔍 [SEO, Google Listings & Ads](docs/SEO.md)
- 📈 [Conversion & Merchandising](docs/CONVERSION.md)
- 👤 [Customer Accounts & Authentication](docs/ACCOUNTS.md)
- 🏛️ [Architecture & Core/Theme Separation](docs/ARCHITECTURE.md)
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md)
- 📋 [Client Onboarding Checklist](docs/CLIENT-ONBOARDING.md)
- 🗄️ [Database Schema & Migrations](docs/DATABASE.md)
- 💳 [Payments & Razorpay Setup](docs/PAYMENTS.md)
- 🎨 [Theme Customisation](docs/THEMING.md)
- 🔌 [Integrations](docs/INTEGRATIONS.md)
- 🧪 [Testing Strategy](docs/TESTING.md)
- 🛡️ [Commerce Security](docs/SECURITY.md)
- 🤖 [Agent & Contribution Rules](agents.md)

---

## 📄 License
Proprietary software developed for multi-client deployment. All rights reserved.
