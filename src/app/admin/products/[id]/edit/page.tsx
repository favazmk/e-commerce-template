import React from "react";
import { notFound } from "next/navigation";
import { CategoryService } from "@/services/category.service";
import { ProductService } from "@/services/product.service";
import { RecommendationService } from "@/services/recommendation.service";
import { ProductForm } from "../../ProductForm";
import type { DraftRelation, RelationType } from "../../RelatedProductsPicker";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, relations] = await Promise.all([
    ProductService.getProductById(id),
    CategoryService.getCategories(false),
    ProductService.getRelations(id),
  ]);

  if (!product) {
    notFound();
  }

  // The picker shows names, not ids. Resolving them here keeps the client
  // component free of a fetch-on-mount that would flash raw ids first.
  const linked = await RecommendationService.getProductsByIds(
    relations.map((r) => r.related_product_id),
    { limit: 50 }
  );
  const byId = new Map(linked.map((p) => [p.id, p]));

  const initialRelations: DraftRelation[] = relations.map((relation) => ({
    related_product_id: relation.related_product_id,
    relation_type: relation.relation_type as RelationType,
    display_order: relation.display_order,
    label: byId.get(relation.related_product_id)?.name,
    image: byId.get(relation.related_product_id)?.images?.[0]?.url ?? null,
  }));

  return (
    <ProductForm
      initialProduct={product}
      categories={categories}
      initialRelations={initialRelations}
    />
  );
}
