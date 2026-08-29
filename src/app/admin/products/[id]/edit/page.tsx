import React from "react";
import { notFound } from "next/navigation";
import { CategoryService } from "@/services/category.service";
import { ProductService } from "@/services/product.service";
import { ProductForm } from "../../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await ProductService.getProductById(id);
  const categories = await CategoryService.getCategories(false);

  if (!product) {
    notFound();
  }

  return <ProductForm initialProduct={product} categories={categories} />;
}
