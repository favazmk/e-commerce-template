/**
 * schema.org JSON-LD builders.
 *
 * Structured data is what turns a plain blue link into a rich result: star
 * ratings, price, stock status and breadcrumbs in the search listing. Google
 * treats fabricated markup as a policy violation, so every builder here emits
 * only fields it can back with real data — an absent rating produces no
 * `aggregateRating` key rather than a zero.
 */

import { getStoreDisplayName } from "@/lib/config/store.config";
import {
  absoluteUrl,
  getLogoUrl,
  getStoreContact,
  getStoreDescription,
} from "@/lib/seo/site";
import type { Product, Review } from "@/types/database";

/** Drop undefined/empty members so the emitted JSON stays clean. */
function compact<T extends Record<string, any>>(input: T): T {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    output[key] = value;
  }
  return output as T;
}

export function organizationJsonLd() {
  const contact = getStoreContact();
  const hasAddress = Boolean(contact.addressLocality && contact.addressCountry);

  return compact({
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${absoluteUrl("/")}#organization`,
    name: getStoreDisplayName(),
    url: absoluteUrl("/"),
    logo: getLogoUrl(),
    description: getStoreDescription(),
    email: contact.email,
    telephone: contact.phone,
    sameAs: contact.socialProfiles,
    address: hasAddress
      ? compact({
          "@type": "PostalAddress",
          streetAddress: contact.streetAddress,
          addressLocality: contact.addressLocality,
          addressRegion: contact.addressRegion,
          postalCode: contact.postalCode,
          addressCountry: contact.addressCountry,
        })
      : undefined,
    contactPoint: contact.email || contact.phone
      ? compact({
          "@type": "ContactPoint",
          contactType: "customer support",
          email: contact.email,
          telephone: contact.phone,
          availableLanguage: process.env.NEXT_PUBLIC_HTML_LANG || "en",
        })
      : undefined,
  });
}

/**
 * WebSite markup including the sitelinks search box, which lets Google surface
 * a search field for the store directly in the results page.
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: getStoreDisplayName(),
    url: absoluteUrl("/"),
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/products")}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface BreadcrumbEntry {
  name: string;
  /** Site-relative path, e.g. "/products". */
  path: string;
}

export function breadcrumbJsonLd(entries: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  };
}

export interface ProductJsonLdOptions {
  product: Product;
  /** Approved reviews only — pending ones must never inflate the rating. */
  reviews?: Review[];
  averageRating?: number | null;
  reviewCount?: number;
}

export function productJsonLd({
  product,
  reviews = [],
  averageRating,
  reviewCount = 0,
}: ProductJsonLdOptions) {
  const url = absoluteUrl(`/products/${product.slug}`);
  const images = (product.images || [])
    .map((image) => image.url)
    .filter(Boolean)
    .map((src) => (src.startsWith("http") ? src : absoluteUrl(src)));

  const inStock = product.stock_quantity > 0 && product.status === "active";

  // Offer validity: a stale `priceValidUntil` makes Google drop the price from
  // the rich result, so it is projected a year out rather than hard-coded.
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const hasRating = typeof averageRating === "number" && reviewCount > 0;

  return compact({
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    url,
    image: images,
    description:
      product.seo_description || product.short_description || product.description || undefined,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand || getStoreDisplayName(),
    },
    category: product.category?.name,
    offers: compact({
      "@type": "Offer",
      url,
      priceCurrency: product.currency || "AED",
      price: Number(product.price).toFixed(2),
      priceValidUntil,
      itemCondition: "https://schema.org/NewCondition",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@id": `${absoluteUrl("/")}#organization` },
    }),
    aggregateRating: hasRating
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(averageRating).toFixed(1),
          reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    review: reviews.slice(0, 5).map((review) =>
      compact({
        "@type": "Review",
        author: { "@type": "Person", name: review.customer_name },
        datePublished: review.created_at?.slice(0, 10),
        name: review.title || undefined,
        reviewBody: review.comment,
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
      })
    ),
  });
}

/** Category / listing pages: an ItemList tells Google what the page enumerates. */
export function itemListJsonLd(products: Product[], listName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/products/${product.slug}`),
      name: product.name,
    })),
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function faqJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}
