# Go-Live Checklist

A store is not "live" when the code deploys. It is live when a stranger can find
it, trust it, buy from it, and get help afterwards. This is the order to do that
in, and why each step matters.

Work top to bottom. Nothing here is optional for a store taking real money.

---

## 1. Before anything else: secrets and mode

- [ ] `.env.local` is in `.gitignore` and has **never** been committed.
      Run `git log --all --full-history -- .env.local` — if it returns anything,
      every credential in it must be rotated, because it is in the repository
      history forever.
- [ ] `APP_MODE=production` and `NEXT_PUBLIC_APP_MODE=production`.
      Demo mode approves payments **without charging anything**. A store left in
      demo mode gives away stock.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set **without** a `NEXT_PUBLIC_` prefix.
      Anything prefixed `NEXT_PUBLIC_` is compiled into the JavaScript every
      visitor downloads. The service role key bypasses all database security.
- [ ] Each client store has its **own** Supabase project and its own keys.
      Never share a database between clients.

## 2. Database

- [ ] Every migration in `supabase/migrations/` has been applied:
      ```bash
      npx supabase db push
      ```
      Or, one file at a time:
      ```bash
      node scripts/apply-migration.mjs supabase/migrations/<file>.sql
      ```
- [ ] **Run the security verifier and get a clean result.** This is the single
      most important check on this page:
      ```bash
      npm run verify:security
      ```
      It signs in as a throwaway customer and *actually performs the attacks*
      against whatever database is in your `.env.local`, then tells you what got
      through. It cleans up after itself and never touches real customer data.

      A migration file proves nothing until it has been applied. If
      `20260105000000_privilege_escalation_fix.sql` has not run, **any registered
      customer can make themselves an administrator from the browser console** —
      and nothing else in the app will look wrong. The verifier is what catches
      that.

      If it reports CRITICAL, fix it before doing anything else:
      ```bash
      npm run db:migrate supabase/migrations/20260105000000_privilege_escalation_fix.sql
      ```

      **Run this again against every client store you deploy**, not just this
      one. Each client has its own database, and each one needs its own migration
      run.
- [ ] You have created your own admin user and set its role:
      ```sql
      UPDATE users SET role = 'super_admin' WHERE email = 'you@yourdomain.com';
      ```
      Do this through the Supabase SQL editor. There is deliberately no way to
      promote yourself from inside the app.

## 3. Store identity

Fill these in `.env.local` — they replace every placeholder in the template:

- [ ] `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_STORE_TAGLINE`, `NEXT_PUBLIC_STORE_DESCRIPTION`
- [ ] `NEXT_PUBLIC_SITE_URL` — your real domain, with `https://`, no trailing slash.
      Sitemaps, canonical URLs, structured data and the product feed all build
      from this. Getting it wrong silently breaks all of them.
- [ ] `NEXT_PUBLIC_DEFAULT_CURRENCY` and `NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL`
- [ ] `NEXT_PUBLIC_STORE_EMAIL` and `NEXT_PUBLIC_STORE_PHONE`
- [ ] `NEXT_PUBLIC_STORE_CITY`, `NEXT_PUBLIC_STORE_COUNTRY` and the rest of the
      address block
- [ ] `NEXT_PUBLIC_GOVERNING_LAW` — the jurisdiction named in your Terms

> **Why contact details are not optional:** Razorpay, Stripe and PayPal all
> check that a live merchant publishes reachable contact details and complete
> policy pages before approving the account. So does Google Merchant Center.
> Leaving them blank is the single most common reason a new store gets rejected.

## 4. Payments

- [ ] `DEFAULT_PAYMENT_PROVIDER=razorpay` (not `mock`)
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
      all set to **live** keys, not test keys
- [ ] The webhook endpoint is registered in your Razorpay dashboard, pointing at
      `https://<your-domain>/api/payments/webhook`
- [ ] You have placed one real, small test order end to end and refunded it

Payment verification **fails closed**: if the key secret or webhook secret is
missing, payments are rejected rather than approved. That is intentional. If
orders are not completing, check these variables first.

## 5. Email

- [ ] `EMAIL_PROVIDER=resend` (not `console` — that only logs to the terminal)
- [ ] `RESEND_API_KEY` set
- [ ] `EMAIL_FROM` uses a domain you have verified with Resend. An unverified
      sender domain means order confirmations land in spam or not at all.

## 6. Legal pages

Every one of these is written for you as a starting point, but **must be
reviewed by a lawyer in the market you sell into** before you take real money.
Consumer law is not the same everywhere.

- [ ] `/privacy-policy` — reviewed, contact details correct
- [ ] `/terms` — governing law set
- [ ] `/refund-policy` — return window matches what you will actually honour
- [ ] `/shipping-policy` — the rate table renders your real configured methods

Set the return window in **Admin → Settings** (`general.return_window_days`), not
in the page text. The page reads the setting, so the two can never disagree.

## 7. Search engines and Google

See [SEO.md](SEO.md) for the full walkthrough. The short version:

- [ ] Visit `https://<your-domain>/robots.txt` — it must **allow** crawling.
      If it says `Disallow: /`, you are still in demo or preview mode.
- [ ] Visit `https://<your-domain>/sitemap.xml` — it must list your products.
- [ ] Add the site to [Google Search Console](https://search.google.com/search-console),
      verify it, and submit the sitemap.
- [ ] Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the verification token.
- [ ] Create a [Google Merchant Center](https://merchants.google.com) account and
      add `https://<your-domain>/feeds/google-merchant.xml` as a scheduled daily feed.
- [ ] Test a product page in the
      [Rich Results Test](https://search.google.com/test/rich-results) — it should
      report a valid Product with price and availability.

## 8. Analytics and ads

All optional, but configure them **before** you spend on advertising — you
cannot retroactively measure traffic you did not track.

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` (GA4)
- [ ] `NEXT_PUBLIC_GOOGLE_ADS_ID` and `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL`
- [ ] Place a test order and confirm the purchase appears in GA4 Realtime and in
      the Google Ads conversion column

Consent Mode v2 is already wired up: tracking starts **denied** and is granted
only after the visitor agrees in the cookie banner. That is mandatory for
EEA/UK traffic and is what keeps conversion reporting working.

## 9. Content

- [ ] At least one category exists and is active
- [ ] Products have real images (`npm run images:sync`, or upload in the admin)
- [ ] Products have `short_description` and `seo_description` filled in —
      these become the search result snippet
- [ ] Homepage sections are configured in **Admin → Homepage**
- [ ] Shipping methods configured in **Admin → Settings**, with a free-shipping
      threshold if you want the progress bar in the cart to appear

## 10. Final verification

Run all of these and make sure they pass:

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

Then, on the deployed site, walk the whole path yourself on a phone:

- [ ] Find a product through search
- [ ] Add to bag, see the free-shipping bar move
- [ ] Check out as a guest and pay
- [ ] Receive the confirmation email
- [ ] Track the order at `/track-order`
- [ ] Register an account, reset the password from the email link, sign back in

---

## After launch

| When | Do this |
|------|---------|
| Week 1 | Check Search Console for crawl errors and Merchant Center for feed rejections |
| Week 1 | Confirm the first real order's confirmation email actually arrived |
| Monthly | Review `back_in_stock_requests` — those are customers waiting to give you money |
| Monthly | Rotate any credential that has been shared with a contractor |
| Quarterly | Re-run `npm run verify:security` against production credentials |
| After any migration | Re-run `npm run verify:security` — a schema change can silently undo a policy |
