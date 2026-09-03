# Conversion & Merchandising

The persuasion layer of the storefront: what is built, the reasoning behind
each piece, and how to configure it.

---

## The rule everything here follows

**Every claim shown to a shopper is backed by a real row in the database.**

That is not squeamishness. Fabricated scarcity ("Only 2 left!" on unlimited
stock), invented view counters and countdown timers that reset on refresh are:

- unlawful under UAE Consumer Protection Law, the EU Unfair Commercial
  Practices Directive, the UK DMCC Act and the US FTC Act;
- grounds for a payment provider to close a merchant account; and
- measurably worse over time — shoppers learn to discount a badge that is always
  present, and it stops working while the legal exposure remains.

Real numbers convert nearly as well and carry none of that. Where there is
nothing true to say, these components render nothing at all.

---

## What is built

### Product cards
- **Discount badge** — only when `compare_at_price` is genuinely higher, rounded
  **down** so a 49.6% saving never advertises itself as 50%.
- **Saving in money** — "Save AED 120" alongside the percentage. A percentage is
  abstract at the moment of decision; an amount is comparable to another product.
- **Rating pill** — from approved reviews only. Absent below one review, because
  five empty stars read as "rated badly", not "not yet rated".
- **Scarcity badge** — driven by the merchant's own `low_stock_threshold` per
  product, so a store selling one-off pieces and one selling socks both read right.
- **Sales proof** — "240 bought in the last 30 days", from real completed orders.
  Suppressed below a threshold, because "3 sold" is worse than silence.
- **Quick add** — always visible on touch devices. A hover-only control is
  unreachable on a phone, which is where most traffic is.

### Product page
- **Sticky mobile buy bar** — the buy button scrolls out of view within one swipe
  on a phone, and shoppers will not scroll back up to act on a decision they have
  already made.
- **Variant axes** — size and colour as separate rows, unavailable combinations
  struck through rather than hidden, so the shopper can see the full range.
- **Delivery dates, not durations** — "Arrives Tue 9 – Thu 11 Sep" rather than
  "3-5 business days". Nobody should have to count working days in their head to
  know whether a parcel lands before the weekend.
- **Returns stated inline** — return terms are the most common reason a
  considered purchase stalls. Answering it in the buy box beats linking to it.
- **Offers block** — real, merchant-promoted coupon codes (see below).
- **Back-in-stock capture** — turns a sold-out dead end into a captured lead.

### Frequently bought together
A bundle widget with the anchor product pre-ticked, live total, and one button
that adds everything. Suggestions come from, in order:

1. a merchant-curated pairing (`product_bundles`),
2. real co-purchase history (`get_frequently_bought_together`),
3. same category and price band — so the widget works on day one, before any
   orders exist.

Prices shown are for display. The cart re-prices every line server-side on add,
so nothing on this screen can affect what is charged.

### Cart
- **Free-shipping progress bar** — the most reliably effective nudge in
  e-commerce, and an honest one: a real saving the shopper controls. States the
  exact shortfall in money.
- **Marked-price breakdown** — "Total marked price → discount → coupon → total",
  then "You save X on this order". Computed server-side, in the same calculation
  that produces the amount charged.
- **"Complete your order"** — companions scored by how many cart lines suggest
  them, added inline. Sending someone back to a product page at this point
  routinely loses the sale that was already in hand.
- **Trust row at the point of commitment** — secure checkout, tracked delivery,
  easy returns.

### Everywhere
- **Recently viewed** — stored in the visitor's own `localStorage`, never on the
  server. Browsing history is personal data; keeping it client-side gives the
  same feature with no retention obligation and nothing to leak.
- **Best sellers** — ranked by units actually sold, falling back to the
  merchant's featured picks before any sales exist.
- **Newsletter capture** — no pre-ticked box, no interstitial popup, no
  "no thanks, I hate savings" shame button.

---

## Configuration

### Return window and delivery expectations

**Admin → Settings**, `general` category:

| Key | Meaning | Default |
|-----|---------|---------|
| `return_window_days` | Days to request a return. `0` hides the returns line entirely. | 0 |
| `refund_processing_days` | Business days to issue a refund once received. | 7 |
| `return_shipping_paid_by` | `customer` or `merchant`. | customer |
| `handling_days` | Working days to pick and pack. | 1 |
| `dispatch_cutoff_hour` | Orders after this hour ship next working day. | 14 |
| `courier_non_working_days` | Day numbers, `0` = Sunday. Use `[5,6]` for a Sunday–Thursday week. | `[0,6]` |

These feed the product page, the shipping policy and the refund policy. The
policy pages read the settings, so the two can never contradict each other —
which matters, because a policy page quoting terms your checkout does not honour
is a chargeback argument you lose.

### Free shipping threshold

Set `free_threshold` on a shipping method in **Admin → Settings**. The cart
progress bar and the product page both derive from it. Leave it unset and the
bar simply does not appear.

### Promoted coupon codes

**Admin → Settings**, `growth` category:

```json
{ "promoted_coupons": ["WELCOME10", "FREESHIP"] }
```

Only codes listed here appear in the product page offers block.

> **This is an allowlist on purpose.** A store's coupon table normally holds
> targeted codes — a win-back offer, one influencer's code, a goodwill gesture
> to a single customer. Publishing every active coupon would hand all of them to
> everyone and turn a targeted discount into a permanent price cut.

Each code is re-validated before it renders: expired, exhausted or deactivated
codes disappear from the page automatically. An advertised code that fails at
checkout costs more than showing nothing.

### Curated product bundles

Co-purchase data needs order history. Until you have some, pin pairings by hand:

```sql
INSERT INTO product_bundles (product_id, related_product_id, relation_type, display_order)
VALUES
  ('<candle-id>', '<holder-id>', 'bundle',  0),
  ('<candle-id>', '<refill-id>', 'bundle',  1),
  ('<candle-id>', '<large-id>',  'upsell',  0);
```

`relation_type` is `bundle` (buy-together widget), `similar` (alternatives) or
`upsell` (a premium alternative). Curated relations always outrank inferred
ones — a merchant who knows the candle goes with that holder knows something the
order data does not.

---

## Capturing demand you would otherwise lose

Two tables quietly collect money you have not yet made:

```sql
-- People waiting for a restock. Email them when it lands.
SELECT p.name, COUNT(*) AS waiting
FROM back_in_stock_requests r
JOIN products p ON p.id = r.product_id
WHERE r.notified_at IS NULL
GROUP BY p.name
ORDER BY waiting DESC;
```

```sql
-- Newsletter list, consent timestamps included.
SELECT email, source, consented_at
FROM newsletter_subscribers
WHERE unsubscribed_at IS NULL;
```

Neither table has a public read policy — an email list readable with the
browser key is a harvestable customer list. Both are written through
rate-limited server routes.

Check the back-in-stock table monthly. Those are people who tried to give you
money and could not.

---

## Measuring whether any of it works

The events in [SEO.md](SEO.md#5-google-ads-conversion-tracking) let you answer
this properly in GA4. The funnel to watch:

```
view_item → add_to_cart → begin_checkout → purchase
```

The biggest drop is almost always `add_to_cart → begin_checkout` (people leave
the cart) or `begin_checkout → purchase` (they abandon at payment). Fix the
larger one first. Everything in this document targets the first three steps; if
your loss is at the last one, the problem is usually unexpected shipping cost,
a forced account requirement, or a payment method you do not offer.
