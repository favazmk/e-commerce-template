import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { getStoreDisplayName } from "@/lib/config/store.config";
import { ProductDetailClient } from "./ProductDetailClient";

export interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = (await ProductService.getProductBySlug(slug)) || (await ProductService.getProductById(slug));

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const primaryImage = product.images?.[0]?.url;

  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.short_description || product.description,
    openGraph: {
      title: product.seo_title || product.name,
      description: product.seo_description || product.short_description,
      images: primaryImage
        ? [{ url: primaryImage, width: 1000, height: 1000, alt: product.name }]
        : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = (await ProductService.getProductBySlug(slug)) || (await ProductService.getProductById(slug));

  if (!product) {
    notFound();
  }

  const relatedProducts = await ProductService.getRelatedProducts(product.id, 4);

  // JSON-LD Structured Data Schema for Rich Google Search Results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images?.map((i) => i.url) || [],
    description: product.short_description || product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand || getStoreDisplayName(),
    },
    offers: {
      "@type": "Offer",
      url: `https://auraluxury.com/products/${product.slug}`,
      priceCurrency: product.currency || "USD",
      price: product.price,
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  );
}
