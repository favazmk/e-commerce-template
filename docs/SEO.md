# SEO, Google Listings & Discoverability

Everything in this document is already built. This explains what it does, what
you have to configure, and what to do in each Google product.

---

## 1. What ships automatically

| Feature | URL / location | What it does |
|---------|----------------|--------------|
| XML sitemap | `/sitemap.xml` | Lists every active product, category and policy page with a real `lastModified` date. Regenerates hourly. |
| robots.txt | `/robots.txt` | Allows crawling of the shop, blocks `/admin`, `/api`, `/account`, `/checkout` and faceted URLs. |
| PWA manifest | `/manifest.webmanifest` | Makes the store installable on a phone home screen. |
| Merchant feed | `/feeds/google-merchant.xml` | Google Shopping / free listings product feed. |
| Meta catalog | `/feeds/meta-catalog.csv` | Instagram Shopping and dynamic product ads. |
| Product markup | every product page | schema.org `Product` with price, stock, brand, rating. |
| Breadcrumb markup | product & category pages | Puts the category path in the search result instead of a raw URL. |
| Organization markup | every page | Ties the store to a brand entity with logo and social profiles. |
| Sitelinks search box | every page | Lets Google show a search field for your store in results. |
| Canonical URLs | every page | Stops filtered and paged variants competing with the page they came from. |
| FAQ markup | `/refund-policy` | Return questions can appear directly in results. |

**Everything is driven by `NEXT_PUBLIC_SITE_URL`.** Set it to your real domain
before launch, or every canonical URL, sitemap entry and feed link will point at
`localhost`.

---

## 2. Preview and demo deployments never get indexed

A staging copy in Google's index competes with the live store for the same
terms and splits the ranking signals between them. So indexing is switched off
automatically when:

- `NEXT_PUBLIC_APP_MODE=demo`, or
- `VERCEL_ENV` is anything other than `production`, or
- `NEXT_PUBLIC_ALLOW_INDEXING=false`

In those cases `robots.txt` returns `Disallow: /`, the sitemap is empty, and the
product feeds return 404.

**If your live site is not being indexed, check these three variables first.**

---

## 3. Google Search Console

This is how you see what Google thinks of your site. Free, and non-optional.

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
   and add your domain.
2. Choose the **HTML tag** verification method and copy the `content="..."` value.
3. Put it in `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-token-here
   ```
4. Redeploy, then click Verify.
5. Go to **Sitemaps** and submit `sitemap.xml`.

Then check back weekly:

- **Pages** → anything under "Not indexed" with a reason worth fixing
- **Experience → Core Web Vitals** → slow pages cost you rankings
- **Enhancements → Merchant listings** → invalid product markup

---

## 4. Google Merchant Center (this is your "Google listing")

Merchant Center is what puts your products into the Shopping tab, into free
product listings, and into Shopping / Performance Max ads.

1. Create an account at [merchants.google.com](https://merchants.google.com).
2. Verify and claim your website (it uses the same Search Console verification).
3. **Products → Feeds → Add feed**:
   - Method: **Scheduled fetch**
   - URL: `https://<your-domain>/feeds/google-merchant.xml`
   - Frequency: **Daily**
4. Set your shipping and tax settings in Merchant Center — Google requires them
   even though your site also has them.

### What the feed sends, and why

- Variants are separate offers sharing an `item_group_id`. That is how Google
  models size and colour, and it preserves per-variant price and stock.
- `sale_price` is only sent when there is a genuinely higher `compare_at_price`.
  Inventing a "was" price is a suspension-level policy violation.
- `identifier_exists: no` is declared because the template has no GTIN field.
  If you sell branded goods with real barcodes, adding a GTIN materially
  improves Shopping performance — it is worth adding a field for it.

### Optional: better categorisation

Set `NEXT_PUBLIC_GOOGLE_PRODUCT_CATEGORY` to a category from
[Google's taxonomy](https://www.google.com/basepages/producttype/taxonomy.en-US.txt),
e.g. `Apparel & Accessories > Clothing`. It improves how Google targets your
Shopping ads.

---

## 5. Google Ads conversion tracking

Without this, Google Ads cannot tell which clicks became sales, so smart bidding
has nothing to optimise against and you are effectively paying blind.

1. In Google Ads: **Goals → Conversions → New conversion action → Website**.
2. Choose **Purchase**, set it to use a **transaction-specific value**.
3. Google gives you two values — a conversion ID (`AW-123456789`) and a
   conversion label (a short random string).
4. Put both in `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_ADS_ID=AW-123456789
   NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL=abcDEF12345
   ```

The confirmation page fires the conversion with the **server-recorded order
total**, not the cart the browser was holding — so the revenue you report is the
revenue you actually took. It is deduplicated on order number, so a customer
refreshing the page cannot inflate your numbers.

### Events tracked automatically

`view_item`, `view_item_list`, `add_to_cart`, `remove_from_cart`, `view_cart`,
`begin_checkout`, `purchase`, `search`. These populate GA4 reports and, more
importantly, Google Ads remarketing audiences — the list that lets you show an
ad to someone who viewed a product but did not buy.

---

## 6. Cookie consent (required for EEA/UK, and for your ad account)

Google Consent Mode v2 has been mandatory since March 2024 for anyone serving
European traffic through Ads or GA4. Without a consent signal Google stops
collecting, and your remarketing audiences quietly empty out.

This is already built:

- Consent defaults are **denied** and are set before any tag loads.
- The banner appears only when a measurement ID is actually configured.
- "Reject all" is the same size and in the same row as "Accept all". A buried
  reject button is not valid consent, and Google's own certification treats it
  as such.
- A "Cookie settings" link in the footer lets a visitor change their mind.

You do not need a third-party consent platform for a single-market store.

---

## 7. Writing product content that ranks

The template handles the technical side. Rankings still come from content.

| Field | What to write |
|-------|---------------|
| `name` | What a customer would type. "Men's Linen Shirt — Navy", not "SKU-4471". |
| `short_description` | One sentence. Appears on cards and as fallback meta description. |
| `seo_title` | Leave blank unless the product name is bad. It falls back to the name. |
| `seo_description` | 140–160 characters. **This is your search result snippet** — write it as an advert, not a summary. |
| `description` | The real detail. Longer is better here; it is what Google reads for relevance. |
| Images | Real photographs. `alt_text` describing the product, not "image1". |
| `brand` | Always fill this in — it feeds both structured data and the Merchant feed. |

**Categories are your most valuable pages.** `/categories/mens-shirts` is what
ranks for "mens shirts" — a query-string variant like `/products?category=...`
cannot. Give every category a real name and a two-or-three sentence description.

---

## 8. Verifying it works

```bash
# Locally, with NEXT_PUBLIC_SITE_URL set to a real domain
npm run build && npm start
```

Then check:

| Check | Where | Expect |
|-------|-------|--------|
| Sitemap | `/sitemap.xml` | Your products, absolute URLs on your domain |
| Robots | `/robots.txt` | `Allow: /` and a `Sitemap:` line |
| Product feed | `/feeds/google-merchant.xml` | One `<item>` per product or variant |
| Structured data | [Rich Results Test](https://search.google.com/test/rich-results) | Valid "Product" and "Breadcrumbs" |
| Metadata | View source on a product page | `<title>`, `<meta name="description">`, `<link rel="canonical">` |
| Social preview | Paste a product URL into WhatsApp or Slack | Title, description and image render |

---

## 9. Common mistakes

| Symptom | Cause |
|---------|-------|
| Sitemap is empty, feed 404s | `NEXT_PUBLIC_APP_MODE=demo` or a preview deployment |
| Canonical URLs say `localhost` | `NEXT_PUBLIC_SITE_URL` not set |
| Merchant Center rejects everything | Missing contact details or unreachable policy pages |
| Rich Results shows no rating | Correct — ratings only appear once real approved reviews exist |
| Ads reports no conversions | `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` missing |
| Nothing tracked at all | No measurement ID set, or the visitor rejected cookies (which is their right) |
