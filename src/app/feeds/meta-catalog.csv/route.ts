import { NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";
import { absoluteUrl, isIndexable } from "@/lib/seo/site";
import { getDefaultCurrency, getStoreDisplayName } from "@/lib/config/store.config";
import type { Product, ProductVariant } from "@/types/database";

/**
 * Meta (Facebook / Instagram) commerce catalog feed, CSV format.
 *
 * Add it in Commerce Manager as a scheduled data feed pointing at
 * `https://<domain>/feeds/meta-catalog.csv`. It powers Instagram Shopping tags,
 * dynamic product ads and retargeting — the ads that show a shopper the exact
 * item they viewed but did not buy.
 */

export const revalidate = 3600;

/** Quote a CSV field. Commas, quotes and newlines all appear in product copy. */
function csvField(value: unknown): string {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function plainText(value: string | null | undefined, max = 5000): string {
  const text = String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function absolute(src: string | undefined): string {
  if (!src) return "";
  return src.startsWith("http") ? src : absoluteUrl(src);
}

const COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "sale_price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "item_group_id",
  "google_product_category",
  "product_type",
] as const;

export async function GET() {
  if (!isIndexable()) {
    return new NextResponse("Catalog feed is disabled on this deployment.", {
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
    console.error("[meta-catalog] Failed to load catalog:", error);
    return new NextResponse("Feed temporarily unavailable", { status: 503 });
  }

  const rows: string[] = [COLUMNS.join(",")];
  const googleCategory = process.env.NEXT_PUBLIC_GOOGLE_PRODUCT_CATEGORY?.trim() || "";

  const pushRow = (
    product: Product,
    offer: {
      id: string;
      title: string;
      price: number;
      compareAtPrice?: number | null;
      stock: number;
      image?: string;
      extraImages: string[];
      itemGroupId?: string;
    }
  ) => {
    const hasSale = offer.compareAtPrice != null && offer.compareAtPrice > offer.price;
    const listPrice = hasSale ? offer.compareAtPrice! : offer.price;

    rows.push(
      [
        csvField(offer.id),
        csvField(plainText(offer.title, 150)),
        csvField(
          plainText(product.description) || plainText(product.short_description) || product.name
        ),
        csvField(offer.stock > 0 ? "in stock" : "out of stock"),
        csvField("new"),
        csvField(`${listPrice.toFixed(2)} ${currency}`),
        csvField(hasSale ? `${offer.price.toFixed(2)} ${currency}` : ""),
        csvField(absoluteUrl(`/products/${product.slug}`)),
        csvField(absolute(offer.image)),
        csvField(offer.extraImages.slice(0, 10).map(absolute).filter(Boolean).join(",")),
        csvField(product.brand || getStoreDisplayName()),
        csvField(offer.itemGroupId || ""),
        csvField(googleCategory),
        csvField(product.category?.name || ""),
      ].join(",")
    );
  };

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
        pushRow(product, {
          id: variant.sku || variant.id,
          itemGroupId: product.sku || product.id,
          title: [product.name, Object.values(variant.attributes || {}).join(" / ")]
            .filter(Boolean)
            .join(" - "),
          price: Number(variant.price),
          compareAtPrice: variant.compare_at_price,
          stock: variant.stock,
          image: variant.image_url || images[0],
          extraImages: images.slice(1),
        });
      }
    } else {
      pushRow(product, {
        id: product.sku || product.id,
        title: product.name,
        price: Number(product.price),
        compareAtPrice: product.compare_at_price,
        stock: product.stock_quantity,
        image: images[0],
        extraImages: images.slice(1),
      });
    }
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
