# ⚡ Aura Luxury — Production-Ready Reusable E-Commerce Starter Engine

> **Live Deployment**: [https://aura-luxury-ecommerce.vercel.app](https://aura-luxury-ecommerce.vercel.app)  
> **Merchant Dashboard**: [https://aura-luxury-ecommerce.vercel.app/admin](https://aura-luxury-ecommerce.vercel.app/admin)

![Aura Luxury Storefront Preview](/public/assets/img/screenshot.png)

---

## 📖 Executive Summary

**Aura Luxury** is an agency-grade, modular, and production-ready e-commerce platform engine engineered with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL / Supabase**.

Engineered specifically for digital agencies that onboard multiple e-commerce retail clients, this system enforces strict architectural decoupling between the **Commerce Core** (orders, inventory, payment verification, cart mathematics, taxes, shipping, coupon engines) and the **Dynamic Theme / Presentation Layer** (branding, tokens, product card layouts, and section builders). A brand new client store can be fully launched and customized in minutes via configuration without touching core commerce logic.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) with React 19
- **Language**: [TypeScript (Strict Mode)](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Dynamic CSS Variable Token Mapping
- **Database & Storage**: [PostgreSQL](https://www.postgresql.org/) / [Supabase](https://supabase.com/) with Row Level Security (RLS) & Migrations
- **Payment Providers**: Razorpay (implemented, tested with mock, tested with real gateway)
- **Email Provider**: Resend (production provider), Console Logger (development provider)
- **State & Forms**: React Context, Zod Schema Validation, React Hook Form
- **Testing Suite**: [Vitest](https://vitest.dev/) with automated unit, integration, and security anti-tampering suites
- **Icons & UI**: Lucide React, Radix UI accessibility standards

---

## ✨ Key Capabilities & Architectural Features

### 🛒 High-End Customer Storefront
- **Dynamic Homepage Builder**: Modular sections (Hero, Curated Categories, Featured Essentials, Promotional Banners, Testimonials, Newsletter) reorderable via database/settings.
- **Facet Catalog & Instant Search**: Fast debounced multi-keyword search, category filtering, price sliders, brand facets, in-stock filters, and sorting.
- **Product Detail Engine**: High-res multi-image gallery with zoom, multi-attribute variant matrix selector (Size, Color, Material), live stock trackers, accordions, and related products recommendations.
- **Anti-Tampering Cart & Mini-Cart**: Server-side price and stock validation, localStorage guest cart persistence with seamless login cart merging, and slide-over mini-cart drawer.
- **Multi-Step Streamlined Checkout**: Contact address book, zone-based shipping calculator (UAE, US, Europe, Worldwide), coupon code engine, and Razorpay modal integration.
- **Customer Account Portal**: Profile management, saved shipping addresses, order receipt viewing, and live lifecycle status timelines.
- **Full SEO & Structured Data**: Dynamic OpenGraph, Twitter Cards, Canonical URLs, and JSON-LD `Product` and `BreadcrumbList` schemas.

### 👔 Comprehensive Merchant Admin Dashboard
- **Executive Analytics**: Real-time sales revenue, order volumes, average order value (AOV), low-stock alerts, and recent customer orders.
- **Product Management**: Intuitive product creator with dynamic multi-attribute variant matrix generator, drag-and-drop media manager, SKU tracker, and SEO snippet preview.
- **Nested Category Manager**: Parent/child hierarchy manager with slugs and banner images.
- **Inventory Ledger**: Live stock tracker, manual stock adjustment modal with audit notes, and immutable `inventory_transactions` history.
- **Order Lifecycle Manager**: Detailed order inspection with frozen price snapshots, customer information, delivery address, and one-click status transitions (`Pending` ➔ `Paid` ➔ `Confirmed` ➔ `Processing` ➔ `Packed` ➔ `Shipped` ➔ `Delivered` ➔ `Cancelled`).
- **Promotions & Coupons**: Percentage and fixed discount rules with minimum spend limits, maximum discount caps, and usage counters.
- **Store & Brand Configuration**: Centralized settings to update brand logos, theme color tokens, tax rules, shipping zones, and feature flags without touching code.

### 🔒 Enterprise Commerce Security
- **Zero Client Trust**: All product prices, discounts, taxes, and shipping rates are strictly recalculated server-side.
- **Cryptographic Payment Verification**: Server-side HMAC-SHA256 signature verification for Razorpay payment captures and webhooks.
- **Atomic Stock Reservation**: Database transaction row-locking prevents overselling and race conditions.
- **Row Level Security (RLS)**: Customer data isolation for profiles, orders, and addresses at the PostgreSQL level.

---

## 🚀 Local Setup & Quickstart

### 1. Clone the repository
```bash
git clone https://github.com/your-org/agency-ecommerce-starter.git
cd agency-ecommerce-starter
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the template configuration file:
```bash
cp .env.example .env.local
```

### 4. Run database migrations (Supabase / Postgres)
```bash
# Apply initial schema and realistic demo seeds
supabase db push
# or run SQL from /supabase/migrations/20260101000000_init_schema.sql
```

### 5. Launch local development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the storefront and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

### 6. Run automated test suite
The platform enforces strict safety nets before deployments. Run the verification pipeline:
```bash
# Core logic & mathematically critical functions (32/32 PASS)
npm run test

# Real DB interactions, webhooks, locking (13/13 PASS)
npm run test:integration

# Real Browser automation via Playwright (5/5 PASS)
npx playwright test
```

---

## 📂 Project Architecture

```text
src/
├── app/
│   ├── (storefront)/         # Customer Storefront Routes (Home, Catalog, PDP, Cart, Checkout, Account)
│   ├── admin/                # Merchant Dashboard Routes (Overview, Products, Orders, Inventory, Settings)
│   └── api/                  # Secure REST API & Payment Webhook Handlers
├── components/
│   ├── ui/                   # Reusable UI Design System (Button, Input, Modal, Drawer, Card, Badge)
│   └── storefront/           # Storefront Components (Header, Footer, MiniCart, ProductCard, SearchModal)
├── features/
│   ├── cart/                 # Cart Context & State Management
│   └── wishlist/             # Wishlist State Management
├── lib/
│   ├── payments/             # PaymentProvider Interface & Adapters (Razorpay, Stripe, Mock)
│   ├── integrations/pos/     # POSProvider Interface & Sunmi POS Adapter
│   └── db/                   # Database Repository Bridge
├── repositories/             # Store Repository with seed bootstrapping
├── services/                 # Commerce Core Services (Product, Cart, Order, Inventory, Tax, Shipping, Coupon)
├── theme/                    # Theme Engine, Token Injector, and Card Variant Switcher
├── types/                    # TypeScript Database & Domain Contracts
└── validations/              # Zod Validation Schemas
```

---

## 📚 Complete Technical Documentation

- 🏛️ [System Architecture & Core vs Theme Separation](docs/ARCHITECTURE.md)
- 🚀 [Production Deployment Guide](docs/DEPLOYMENT.md)
- 📋 [17-Step Client Onboarding Checklist](docs/CLIENT-ONBOARDING.md)
- 🗄️ [Database Schema & Migration Docs](docs/DATABASE.md)
- 💳 [Payment Gateways & Razorpay Setup](docs/PAYMENTS.md)
- 🎨 [Theme Customization & Visual Variants](docs/THEMING.md)
- 🔌 [Hardware POS & Cloud Integrations](docs/INTEGRATIONS.md)
- 🧪 [Automated Testing Strategy](docs/TESTING.md)
- 🛡️ [Commerce Security & Anti-Tampering](docs/SECURITY.md)

---

## 📄 License
This project is proprietary software developed for multi-client deployment. All rights reserved.
