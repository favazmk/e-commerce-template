# 🚀 Production Deployment Guide

This guide outlines step-by-step instructions for deploying the e-commerce platform on **Vercel** backed by **Supabase PostgreSQL & Cloud Storage**.

---

## 1. Prerequisites
- A GitHub repository with this codebase
- A [Vercel](https://vercel.com) account
- A [Supabase](https://supabase.com) account
- A [Razorpay](https://razorpay.com) Live/Test Merchant Account

---

## 2. Step-by-Step Deployment

### Step 1: Provision Supabase Database
1. Go to [database.new](https://database.new) and create a new project.
2. Under **Project Settings > API**, copy the following values:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`
3. Apply **every** migration in `supabase/migrations/`, in filename order.
   Filename order is the dependency order — later files alter tables the
   earlier ones create, so a run out of order fails.

   | # | File | What it adds |
   |---|---|---|
   | 1 | `20260101000000_init_schema.sql` | Tables, enums, base RLS |
   | 2 | `20260102000000_rls_hardening.sql` | Tightened row-level policies |
   | 3 | `20260103000000_currency_aed.sql` | Currency default and backfill |
   | 4 | `20260104000000_admin_change_log.sql` | Admin audit trail |
   | 5 | `20260105000000_privilege_escalation_fix.sql` | Role-escalation fix |
   | 6 | `20260106000000_merchandising_and_growth.sql` | Merchandising tables |
   | 7 | `20260107000000_product_badges_and_swatches.sql` | Badges and swatches |

   Either paste each file into the Supabase **SQL Editor** in this order, or,
   with `DATABASE_URL` set, run them from a shell:

   ```bash
   for f in supabase/migrations/*.sql; do npm run db:migrate "$f" || break; done
   ```

   > Applying only the first file leaves a store with no RLS hardening, an
   > unpatched privilege-escalation path, the wrong currency default and no
   > merchandising tables. The storefront will still boot, which is what makes
   > this worth stating: the failure is silent.

   Verify before continuing — this should report 25:

   ```bash
   npm run db:query "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'"
   ```

4. Create a public storage bucket named `ecommerce-assets` under **Storage**.

### Step 2: Configure Vercel Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2. Select your GitHub repository.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_SITE_URL`: `https://your-custom-domain.com`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: `rzp_live_your_key`
   - `RAZORPAY_KEY_SECRET`: `your_live_secret`
   - `RAZORPAY_WEBHOOK_SECRET`: `your_webhook_secret`
   - `DEFAULT_PAYMENT_PROVIDER`: `razorpay`
4. Click **Deploy**.

### Step 3: Setup Razorpay Webhooks
1. In Razorpay Dashboard > **Settings > Webhooks > Add New Webhook**.
2. Set Webhook URL: `https://your-custom-domain.com/api/payments/webhook`.
3. Set Secret: (matches `RAZORPAY_WEBHOOK_SECRET`).
4. Select active events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
