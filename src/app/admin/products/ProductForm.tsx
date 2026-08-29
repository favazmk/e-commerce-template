"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Image as ImageIcon, Sparkles, Check, ArrowLeft } from "lucide-react";
import { Category, Product, ProductImage, ProductVariant } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductForm({
  initialProduct,
  categories = [],
}: {
  initialProduct?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  // Form State
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [brand, setBrand] = useState(initialProduct?.brand || "Aura Studio");
  const [categoryId, setCategoryId] = useState(initialProduct?.category_id || categories[0]?.id || "");
  const [shortDescription, setShortDescription] = useState(initialProduct?.short_description || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [price, setPrice] = useState(initialProduct?.price ? String(initialProduct.price) : "100");
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialProduct?.compare_at_price ? String(initialProduct.compare_at_price) : ""
  );
  const [costPrice, setCostPrice] = useState(
    initialProduct?.cost_price ? String(initialProduct.cost_price) : ""
  );
  const [sku, setSku] = useState(initialProduct?.sku || `SKU-${Date.now().toString().slice(-6)}`);
  const [stockQuantity, setStockQuantity] = useState(
    initialProduct?.stock_quantity !== undefined ? String(initialProduct.stock_quantity) : "25"
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialProduct?.low_stock_threshold ? String(initialProduct.low_stock_threshold) : "5"
  );
  const [status, setStatus] = useState<any>(initialProduct?.status || "active");
  const [featured, setFeatured] = useState(initialProduct?.featured || false);

  // Images State
  const [images, setImages] = useState<Partial<ProductImage>[]>(
    initialProduct?.images || [
      {
        url: "/placeholder-product.png",
        alt_text: "Product Primary Image",
        display_order: 1,
        is_primary: true,
      },
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  // Dynamic Variants Matrix Generator State
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>(
    initialProduct?.variants || []
  );
  const [attrName, setAttrName] = useState("Size");
  const [attrValues, setAttrValues] = useState("Small, Medium, Large");

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(initialProduct?.seo_description || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleAutoSlug = () => {
    const s = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(s);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        url: newImageUrl.trim(),
        alt_text: name,
        display_order: prev.length + 1,
        is_primary: prev.length === 0,
      },
    ]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateVariants = () => {
    if (!attrValues.trim()) return;
    const splitValues = attrValues.split(",").map((v) => v.trim()).filter(Boolean);

    const generated: Partial<ProductVariant>[] = splitValues.map((val, idx) => ({
      id: `var-new-${idx + 1}`,
      sku: `${sku || "SKU"}-${val.toUpperCase().slice(0, 3)}`,
      price: Number(price) || 0,
      stock: Math.floor((Number(stockQuantity) || 20) / splitValues.length) || 5,
      is_active: true,
      attributes: { [attrName]: val },
    }));

    setVariants(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        brand,
        category_id: categoryId || null,
        short_description: shortDescription,
        description,
        price: Number(price) || 0,
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        cost_price: costPrice ? Number(costPrice) : null,
        sku,
        stock_quantity: Number(stockQuantity) || 0,
        low_stock_threshold: Number(lowStockThreshold) || 5,
        status,
        featured,
        images,
        variants,
        seo_title: seoTitle || name,
        seo_description: seoDescription || shortDescription,
      };

      const url = isEditing ? `/api/products/${initialProduct!.id}` : `/api/products`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || "Failed to save product");
      }

      setMessage("Product saved successfully!");
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
          </button>
          <h1 className="text-2xl font-bold font-heading text-slate-900">
            {isEditing ? `Edit Product: ${initialProduct?.name}` : "Create New Product"}
          </h1>
        </div>
        <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="shadow-xs">
          Save Product
        </Button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-brand text-xs font-semibold ${
            message.startsWith("Error")
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* 1. Basic Details */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          1. General Product Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Product Title"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cashmere Oversized Overcoat"
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="URL Slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="cashmere-oversized-overcoat"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAutoSlug} className="mb-0.5">
              Auto Slug
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Brand Name" name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Category
            </label>
            <select
              name="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-brand border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Status
            </label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-brand border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none"
            >
              <option value="active">Active (Visible)</option>
              <option value="draft">Draft (Hidden)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <Input
            label="Short Summary"
            name="short_description"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Brief 1-sentence teaser for product cards"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Full Description & Care
          </label>
          <textarea
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-brand border border-slate-300 p-3 text-xs focus:outline-none"
            placeholder="Detailed narrative describing drape, origin, craftsmanship..."
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            name="featured"
            id="featuredToggle"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="rounded-xs text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="featuredToggle" className="text-xs font-semibold text-slate-800">
            Feature this product on homepage curations
          </label>
        </div>
      </div>

      {/* 2. Pricing & Inventory */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          2. Pricing & Base Inventory
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Selling Price ($)"
            name="price"
            type="number"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label="Original Compare Price ($)"
            name="compare_at_price"
            type="number"
            step="0.01"
            placeholder="e.g. 650.00"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
          />
          <Input
            label="Cost Price ($)"
            name="cost_price"
            type="number"
            step="0.01"
            placeholder="e.g. 180.00"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Master SKU" name="sku" required value={sku} onChange={(e) => setSku(e.target.value)} />
          <Input
            label="Total Stock Quantity"
            name="stock_quantity"
            type="number"
            required
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
          />
          <Input
            label="Low Stock Warning Threshold"
            name="low_stock_threshold"
            type="number"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Product Images */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          3. Media & Product Imagery
        </h2>

        <div className="flex gap-2">
          <Input
            placeholder="Paste public image URL (Unsplash or Supabase Storage)..."
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleAddImage}>
            Add Image
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-brand overflow-hidden border border-slate-200 bg-slate-50 group">
              <img src={img.url} alt="Product image preview" className="h-full w-full object-cover" />
              {img.is_primary && (
                <span className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-rose-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Dynamic Variant Matrix Generator */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            4. Dynamic Variants Matrix
          </h2>
          <span className="text-xs text-slate-400 font-medium">{variants.length} Variants Configured</span>
        </div>

        <div className="p-4 rounded-brand bg-slate-50 border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Attribute Name" value={attrName} onChange={(e) => setAttrName(e.target.value)} />
            <Input
              label="Attribute Values (comma separated)"
              value={attrValues}
              onChange={(e) => setAttrValues(e.target.value)}
              placeholder="e.g. Small, Medium, Large"
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleGenerateVariants} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Generate Combinations
          </Button>
        </div>

        {variants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-100 rounded-brand">
              <thead className="bg-slate-100 uppercase font-semibold text-slate-600">
                <tr>
                  <th className="p-3">Attributes</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Price ($)</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variants.map((v, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-slate-900">
                      {Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(", ")}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{v.sku}</td>
                    <td className="p-3 font-bold text-slate-900">${v.price}</td>
                    <td className="p-3">{v.stock} in stock</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. SEO Preview */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          5. SEO & Search Snippet
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="SEO Meta Title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="Custom title for Google search"
          />
          <Input
            label="SEO Meta Description"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="Custom snippet description"
          />
        </div>

        {/* Google Snippet Live Simulation */}
        <div className="p-4 rounded-brand bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
            Google Search Preview
          </span>
          <p className="text-xs text-blue-800 font-medium hover:underline cursor-pointer">
            {seoTitle || name || "Product Title"} | AURA LUXURY
          </p>
          <p className="text-[11px] text-emerald-800 font-mono">
            https://auraluxury.com/products/{slug || "product-slug"}
          </p>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
            {seoDescription || shortDescription || "Explore our handcrafted artisanal collection."}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" size="md" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
          Save Product
        </Button>
      </div>
    </form>
  );
}
