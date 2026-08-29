import React from "react";
import { CategoryService } from "@/services/category.service";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const categories = await CategoryService.getCategories(false);
  return <ProductForm categories={categories} />;
}
