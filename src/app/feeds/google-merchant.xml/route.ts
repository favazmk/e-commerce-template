import { NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";
import { absoluteUrl, isIndexable, getStoreDescription } from "@/lib/seo/site";
import { getDefaultCurrency, getStoreDisplayName } from "@/lib/config/store.config";
import type { Product, ProductVariant } from "@/types/database";

/**
 * Google Merchant Center product feed (RSS 2.0 + the `g:` namespace).
 *
 * This is what puts the catalog into Google Shopping, free product listings and
 * Performance Max / Shopping ads. Point Merchant Center at
 * `https://<domain>/feeds/google-merchant.xml` and set it to fetch daily.
 *
 * Variants are emitted as separate offers sharing an `item_group_id`, which is
 * how Google models size/colour options — collapsing them into one offer loses
 * the per-variant price and stock that shoppers filter on.
 */

// Regenerated hourly. Merchant Center fetches at most daily, so this is ample.
export const revalidate = 3600;

/**
 * Characters that are illegal in XML 1.0. A single one anywhere in the document
 * makes Merchant Center reject the entire feed, not just the offending offer.
 */
const CONTROL_CHARS = new RegExp(
  "[" +
    "\\u0000-\\u0008" +
    "\\u000B\\u000C" +
    "\\u000E-\\u001F" +
    "]",
  "g"
);

/** Escape text for XML. Product copy is merchant input and may contain markup. */
function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Control characters are invalid in XML 1.0 and reject the whole feed.
    .replace(CONTROL_CHARS, "");
}

/** Strip HTML and clamp to Merchant Center's 5000-character description limit. */
function plainText(value: string | null | undefined, max = 5000): string {
  const text = String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function imageUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;
  return src.startsWith("http") ? src : absoluteUrl(src);
}

interface OfferInput {
  offerId: string;
  itemGroupId?: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  sku: string;
  image?: string;
  additionalImages: string[];
  attributes?: Record<string, string>;
}

function buildOffer(product: Product, offer: OfferInput, currency: string): string {
  const link = absoluteUrl(`/products/${product.slug}`);
  const description =
    plainText(product.description) || plainText(product.short_description) || product.name;

  // A `sale_price` only means something when there is a higher list price to
  // compare against; otherwise Google flags the offer for a misleading discount.
  const hasSale = offer.compareAtPrice != null && offer.compareAtPrice > offer.price;
  const listPrice = hasSale ? offer.compareAtPrice! : offer.price;

  const parts: string[] = [
    `<g:id>${xmlEscape(offer.offerId)}</g:id>`,
    `<title>${xmlEscape(plainText(offer.title, 150))}</title>`,
    `<description>${xmlEscape(description)}</description>`,
    `<link>${xmlEscape(link)}</link>`,
    `<g:condition>new</g:condition>`,
    `<g:availability>${offer.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>`,
    `<g:price>${listPrice.toFixed(2)} ${xmlEscape(currency)}</g:price>`,
  ];

  if (hasSale) {
    parts.push(`<g:sale_price>${offer.price.toFixed(2)} ${xmlEscape(currency)}</g:sale_price>`);
  }

  const image = imageUrl(offer.image);
  if (image) parts.push(`<g:image_link>${xmlEscape(image)}</g:image_link>`);
  for (const extra of offer.additionalImages.slice(0, 10)) {
    const url = imageUrl(extra);
    if (url) parts.push(`<g:additional_image_link>${xmlEscape(url)}</g:additional_image_link>`);
  }

  parts.push(`<g:brand>${xmlEscape(product.brand || getStoreDisplayName())}</g:brand>`);
  parts.push(`<g:mpn>${xmlEscape(offer.sku)}</g:mpn>`);
  // Without a real GTIN, `identifier_exists=no` is the required declaration —
  // inventing a barcode gets the Merchant Center account suspended.
  parts.push(`<g:identifier_exists>no</g:identifier_exists>`);

  if (offer.itemGroupId) {
    parts.push(`<g:item_group_id>${xmlEscape(offer.itemGroupId)}</g:item_group_id>`);
  }
  if (product.category?.name) {
    parts.push(`<g:product_type>${xmlEscape(product.category.name)}</g:product_type>`);
  }

  // Variant axes Google understands natively.
  const attributes = offer.attributes || {};
  for (const [key, value] of Object.entries(attributes)) {
    const axis = key.toLowerCase();
    if (axis === "size") parts.push(`<g:size>${xmlEscape(value)}</g:size>`);
    else if (axis === "color" || axis === "colour") parts.push(`<g:color>${xmlEscape(value)}</g:color>`);
    else if (axis === "material") parts.push(`<g:material>${xmlEscape(value)}</g:material>`);
  }

  const googleCategory = process.env.NEXT_PUBLIC_GOOGLE_PRODUCT_CATEGORY?.trim();
  if (googleCategory) {
    parts.push(`<g:google_product_category>${xmlEscape(googleCategory)}</g:google_product_category>`);
  }

  return `    <item>\n      ${parts.join("\n      ")}\n    </item>`;
}

export async function GET() {
  // A feed from a preview deployment would advertise staging URLs as shoppable.
  if (!isIndexable()) {
    return new NextResponse("Product feed is disabled on this deployment.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const currency = getDefaultCurrency();
  let products: Product[] = [];

  try {
    const result = await ProductService.getProducts({ limit: 5000 });
    products = result.items;
  } catch (error) {
    console.error("[merchant-feed] Failed to load catalog:", error);
    return new NextResponse("Feed temporarily unavailable", { status: 503 });
  }

  const items: string[] = [];

  for (const product of products) {
    const images = (product.images || [])
      .slice()
      .sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order
      )
      .map((image) => image.url)
      .filter(Boolean);

    const activeVariants = (product.variants || []).filter((v: ProductVariant) => v.is_active);

    if (activeVariants.length > 0) {
      for (const variant of activeVariants) {
        items.push(
          buildOffer(
            product,
            {
              offerId: variant.sku || variant.id,
              itemGroupId: product.sku || product.id,
              title: [product.name, Object.values(variant.attributes || {}).join(" / ")]
                .filter(Boolean)
                .join(" - "),
              price: Number(variant.price),
              compareAtPrice: variant.compare_at_price,
              stock: variant.stock,
              sku: variant.sku,
              image: variant.image_url || images[0],
              additionalImages: images.slice(1),
              attributes: variant.attributes,
            },
            currency
          )
        );
      }
    } else {
      items.push(
        buildOffer(
          product,
          {
            offerId: product.sku || product.id,
            title: product.name,
            price: Number(product.price),
            compareAtPrice: product.compare_at_price,
            stock: product.stock_quantity,
            sku: product.sku,
            image: images[0],
            additionalImages: images.slice(1),
          },
          currency
        )
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(getStoreDisplayName())}</title>
    <link>${xmlEscape(absoluteUrl("/"))}</link>
    <description>${xmlEscape(plainText(getStoreDescription(), 500))}</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
