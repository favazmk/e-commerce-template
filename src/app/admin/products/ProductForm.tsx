"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Sparkles, ArrowLeft, Star } from "lucide-react";
import {
  Category,
  Product,
  ProductBadgeTone,
  ProductImage,
  ProductVariant,
} from "@/types/database";
import { BADGE_TONE_CLASSES } from "@/lib/commerce/merchandising";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { getCurrencyLabel, getSiteUrl } from "@/lib/config/store.config";
import Image from "next/image";

export function ProductForm({
  initialProduct,
  categories = [],
}: {
  initialProduct?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);
  const currency = getCurrencyLabel();

  // Form State
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [brand, setBrand] = useState(initialProduct?.brand || "");
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
  const [status, setStatus] = useState<Product["status"]>(initialProduct?.status || "active");
  const [featured, setFeatured] = useState(initialProduct?.featured || false);
  const [badgeLabel, setBadgeLabel] = useState(initialProduct?.badge_label || "");
  const [badgeTone, setBadgeTone] = useState<ProductBadgeTone>(
    initialProduct?.badge_tone || "primary"
  );

  // Images — start from whatever the product already has, with no blank rows.
  const [images, setImages] = useState<Partial<ProductImage>[]>(
    (initialProduct?.images || []).filter((img) => img.url)
  );

  // Variants (sizes, colours…) with independently editable stock.
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

  /**
   * Once a product has variants, the product-level stock is the sum of them —
   * editing the two independently is how the numbers drift apart.
   */
  const variantStockTotal = useMemo(
    () => variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    [variants]
  );
  const hasVariants = variants.length > 0;

  const handleAutoSlug = () => {
    setSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    );
  };

  const handleAddImage = (url: string) => {
    setImages((prev) => [
      ...prev,
      {
        url,
        alt_text: name || "Product image",
        display_order: prev.length,
        is_primary: prev.length === 0,
      },
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // The list must always have exactly one primary image.
      if (next.length > 0 && !next.some((img) => img.is_primary)) {
        next[0] = { ...next[0], is_primary: true };
      }
      return next;
    });
  };

  const handleMakePrimary = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, is_primary: i === index })));
  };

  const handleGenerateVariants = () => {
    if (!attrValues.trim()) return;
    const values = attrValues.split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) return;

    const basePrice = Number(price) || 0;
    const spread = Math.floor((Number(stockQuantity) || 0) / values.length);

    setVariants((prev) => {
      const existingKeys = new Set(prev.map((v) => JSON.stringify(v.attributes || {})));

      const generated = values
        .map((value) => ({
          sku: `${sku || "SKU"}-${value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)}`,
          price: basePrice,
          stock: spread,
          is_active: true,
          attributes: { [attrName]: value } as Record<string, string>,
        }))
        // Never silently overwrite a size the admin has already stocked.
        .filter((v) => !existingKeys.has(JSON.stringify(v.attributes)));

      return [...prev, ...generated];
    });
  };

  const updateVariant = (index: number, patch: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
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
        // With variants present, the total is derived rather than typed.
        stock_quantity: hasVariants ? variantStockTotal : Number(stockQuantity) || 0,
        low_stock_threshold: Number(lowStockThreshold) || 5,
        status,
        featured,
        // Empty means "let the storefront decide", so it is stored as null
        // rather than as an empty string.
        badge_label: badgeLabel.trim() || null,
        badge_tone: badgeTone,
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
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to save product");
      }

      setMessage("Product saved successfully!");
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 900);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
          </button>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            {isEditing ? `Edit Product: ${initialProduct?.name}` : "Create New Product"}
          </h1>
        </div>
        <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="shadow-sm">
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
          <Input
            label="Product Title"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cashmere Oversized Overcoat"
          />
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
            <label
              htmlFor="category_id"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Category
            </label>
            <select
              id="category_id"
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
            <label
              htmlFor="status"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Product["status"])}
              className="w-full rounded-brand border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none"
            >
              <option value="active">Active (Visible)</option>
              <option value="draft">Draft (Hidden)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <Input
          label="Short Summary"
          name="short_description"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Brief 1-sentence teaser for product cards"
        />

        <div className="space-y-1.5 text-left">
          <label
            htmlFor="description"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Full Description &amp; Care
          </label>
          <textarea
            id="description"
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
            className="rounded-sm text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="featuredToggle" className="text-xs font-semibold text-slate-800">
            Feature this product on homepage curations
          </label>
        </div>

        {/* ------------------------------------------------------ Badge --- */}
        <div className="space-y-3 rounded-brand border border-slate-200 bg-slate-50 p-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Product card badge
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Shown on the corner of the product card. Leave the label blank and the storefront
              picks one from real data — &ldquo;BESTSELLER&rdquo; once it is genuinely selling,
              &ldquo;NEW&rdquo; for the first three weeks, otherwise nothing. Set a label here to
              override that. One badge per product: two badges say less than one.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Badge label (optional)"
              value={badgeLabel}
              maxLength={24}
              onChange={(e) => setBadgeLabel(e.target.value)}
              placeholder="e.g. BESTSELLER, LIMITED, EID EDIT"
              helperText="Blank = decided automatically. Max 24 characters."
            />

            <div className="w-full space-y-1.5 text-left">
              <label
                htmlFor="badgeTone"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Badge colour
              </label>
              <select
                id="badgeTone"
                value={badgeTone}
                onChange={(e) => setBadgeTone(e.target.value as ProductBadgeTone)}
                className="block w-full rounded-brand border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="primary">Brand — general highlight</option>
                <option value="success">Green — new arrival, in stock</option>
                <option value="discount">Orange — bestseller, deal</option>
                <option value="urgent">Red — limited, last chance</option>
                <option value="neutral">Dark — understated</option>
              </select>

              {badgeLabel.trim() && (
                <div className="pt-1.5">
                  <span className="mr-2 text-[11px] text-slate-500">Preview:</span>
                  <span
                    className={`inline-block rounded-brand-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${BADGE_TONE_CLASSES[badgeTone]}`}
                  >
                    {badgeLabel.trim().toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pricing & Inventory */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          2. Pricing &amp; Base Inventory
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={`Selling Price (${currency})`}
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label={`Original Compare Price (${currency})`}
            name="compare_at_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 650.00"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
          />
          <Input
            label={`Cost Price (${currency})`}
            name="cost_price"
            type="number"
            step="0.01"
            min="0"
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
            min="0"
            required={!hasVariants}
            disabled={hasVariants}
            value={hasVariants ? String(variantStockTotal) : stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            helperText={
              hasVariants
                ? "Calculated from the per-size stock in section 4."
                : "Add sizes below to track stock per size instead."
            }
          />
          <Input
            label="Low Stock Warning Threshold"
            name="low_stock_threshold"
            type="number"
            min="0"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Product Images */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          3. Media &amp; Product Imagery
        </h2>

        <ImageUploader
          onUploaded={handleAddImage}
          multiple
          label="Upload product photos from your device"
        />

        {images.length === 0 ? (
          <p className="rounded-brand border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400">
            No images yet. The first image you add becomes the main photo shown on cards and search.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {images.map((img, i) => (
              <div
                key={`${img.url}-${i}`}
                className="group relative aspect-[3/4] rounded-brand overflow-hidden border border-slate-200 bg-slate-50"
              >
                <Image
                  fill
                  sizes="(max-width: 640px) 50vw, 160px"
                  src={img.url || ""}
                  alt={img.alt_text || "Product image preview"}
                  className="h-full w-full object-cover"
                />

                {img.is_primary ? (
                  <span className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">
                    Main
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMakePrimary(i)}
                    className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    title="Use as the main product photo"
                  >
                    <Star className="h-3 w-3" /> Main
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-rose-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Variants — sizes, colours, and their own stock */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            4. Sizes &amp; Variants
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {variants.length} configured · {variantStockTotal} units total
          </span>
        </div>

        <div className="p-4 rounded-brand bg-slate-50 border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Attribute Name"
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              placeholder="Size"
            />
            <Input
              label="Attribute Values (comma separated)"
              value={attrValues}
              onChange={(e) => setAttrValues(e.target.value)}
              placeholder="e.g. Small, Medium, Large"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGenerateVariants}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Add these sizes
          </Button>
          <p className="text-[11px] text-slate-500">
            Sizes you already have are left untouched. Edit price and stock per row below.
          </p>
        </div>

        {variants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs border border-slate-100 rounded-brand">
              <thead className="bg-slate-100 uppercase font-semibold text-slate-600">
                <tr>
                  <th className="p-3">Size / Variant</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Price ({currency})</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Active</th>
                  <th className="p-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variants.map((v, idx) => (
                  <tr key={v.id || idx} className="align-middle">
                    <td className="p-3 font-semibold text-slate-900">
                      {Object.entries(v.attributes || {})
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(", ") || "—"}
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={v.sku || ""}
                        onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                        className="w-32 rounded-brand border border-slate-300 px-2 py-1.5 font-mono text-[11px] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        aria-label="Variant SKU"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={v.price ?? 0}
                        onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })}
                        className="w-24 rounded-brand border border-slate-300 px-2 py-1.5 text-[11px] focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        aria-label="Variant price"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={v.stock ?? 0}
                        onChange={(e) =>
                          updateVariant(idx, { stock: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="w-20 rounded-brand border border-slate-300 px-2 py-1.5 text-[11px] font-bold focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        aria-label="Variant stock"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={v.is_active !== false}
                        onChange={(e) => updateVariant(idx, { is_active: e.target.checked })}
                        aria-label="Variant is active"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove this size"
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
          5. SEO &amp; Search Snippet
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

        <div className="p-4 rounded-brand bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
            Google Search Preview
          </span>
          <p className="text-xs text-blue-800 font-medium">{seoTitle || name || "Product Title"}</p>
          <p className="text-[11px] text-emerald-800 font-mono break-all">
            {getSiteUrl()}/products/{slug || "product-slug"}
          </p>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
            {seoDescription || shortDescription || "Add a short summary to control this snippet."}
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
