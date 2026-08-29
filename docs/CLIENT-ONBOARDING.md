# 📋 17-Step Agency Client Onboarding Checklist

This document is the internal standard operating procedure (SOP) for launching a new commercial client store from this starter engine in **under 30 minutes**.

---

## ⚡ The 17-Step Onboarding Workflow

### Step 1: Duplicate Repository
Clone or generate a clean repo from the template:
```bash
git clone https://github.com/agency/e-commerce-starter.git client-store-name
cd client-store-name
```

### Step 2: Provision Database & Cloud Storage
Create a new Supabase project (e.g. `client-bakery-prod` or `client-fashion-prod`).

### Step 3: Execute Schema Migration
Run the initial SQL migration inside Supabase SQL Editor:
```bash
supabase db push
# or paste /supabase/migrations/20260101000000_init_schema.sql
```

### Step 4: Configure `.env.local`
Set client credentials in `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=https://store.clientname.com
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### Step 5: Configure Brand Identity in Theme Config
Edit `src/theme/theme.config.ts` or set via Merchant Admin (`/admin/settings`):
- `brand.name`
- `brand.tagline`
- `colors.primary`, `colors.secondary`, `colors.accent`
- `typography.fontHeading`, `typography.fontBody`
- `styling.borderRadius` (e.g. `0.75rem` or `0px` for brutalist/luxury)
- `styling.productCardVariant` (`luxury` | `minimal` | `classic` | `compact`)

### Step 6: Upload Logo & Favicon
Place SVG/PNG brand assets into `/public/` or upload via `/admin/media`.

### Step 7: Define Categories Hierarchy
In `/admin/categories`, create the primary and nested subcategories for the client's catalog.

### Step 8: Upload Client Products & Variants
In `/admin/products/new`:
- Input Product Name, Description, SKU, and Price.
- Add dynamic variant combinations (Sizes, Colors, Materials) using the variant matrix generator.
- Drag-and-drop product imagery.

### Step 9: Configure Delivery Zones & Shipping Rules
In `/admin/settings`:
- Set Free Shipping thresholds (e.g. `$150`).
- Configure Zone Rates (UAE Domestic, US Standard, International).

### Step 10: Configure Tax Rules
In `/admin/settings`:
- Toggle Sales Tax / VAT.
- Set percentage (e.g. `5%` for UAE VAT, `8.5%` for US).
- Choose Inclusive vs Exclusive tax calculation.

### Step 11: Setup Promotional Launch Coupons
In `/admin/coupons`, create launch codes (e.g. `LAUNCH10` for 10% off).

### Step 12: Customize Homepage Sections
In `/admin/homepage`, configure Hero headlines, Promotional banners, and reorder sections.

### Step 13: Connect Payment Gateway Credentials
Switch `DEFAULT_PAYMENT_PROVIDER=razorpay` and input live API Keys.

### Step 14: Test End-to-End Customer Flow
1. Add product to bag.
2. Verify coupon calculation.
3. Test address input and checkout modal.
4. Verify order creation receipt.

### Step 15: Deploy to Vercel
Connect the client repository to Vercel and input production environment variables.

### Step 16: Connect Custom Domain & SSL
Assign `store.clientdomain.com` in Vercel DNS settings.

### Step 17: Hand Off Merchant Credentials
Provide client owner with `/admin` login to manage catalog, orders, and sales without touching code.
