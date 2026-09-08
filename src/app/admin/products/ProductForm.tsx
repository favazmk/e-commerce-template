"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Trash2,
  ArrowLeft,
  ArrowRight,
  Star,
  X,
  Tag as TagIcon,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  Category,
  InventoryPolicy,
  Product,
  ProductBadgeTone,
  ProductImage,
  ProductOption,
} from "@/types/database";
import { BADGE_TONE_CLASSES } from "@/lib/commerce/merchandising";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { getCurrencyLabel, getSiteUrl } from "@/lib/config/store.config";
import { VariantMatrix, type DraftVariant } from "./VariantMatrix";
import { RelatedProductsPicker, type DraftRelation } from "./RelatedProductsPicker";

/**
 * The product editor.
 *
 * Organised the way Shopify and WooCommerce organise theirs, because the order
 * is not cosmetic: it matches the order a merchant actually knows the answers
 * in. Identity and copy first (they are looking at the product), then photos,
 * then price, then stock, then the variant grid, then the things that only
 * matter at dispatch, and finally search. A form that asks for shipping weight
 * before the product has a name gets abandoned.
 *
 * Two rules run through it:
 *   * Nothing is silently derived that the merchant would be surprised by. The
 *     stock field locks itself when variants exist and says why, rather than
 *     accepting a number it is about to overwrite.
 *   * Anything that will be shown to a shopper is previewed here — the badge,
 *     the sale price, the Google snippet — so the first time it is seen is not
 *     on the live storefront.
 */

/** ISO timestamp -> the value a datetime-local input expects, in local time. */
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** The inverse, so a merchant typing "09:00" means 09:00 where they are. */
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function Section({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          {step}. {title}
        </h2>
        {description && (
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  help?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded-sm text-emerald-600 focus:ring-emerald-500"
      />
      <label htmlFor={id} className="text-xs text-slate-800">
        <span className="font-semibold">{label}</span>
        {help && <span className="mt-0.5 block text-[11px] text-slate-500">{help}</span>}
      </label>
    </div>
  );
}

export function ProductForm({
  initialProduct,
  categories = [],
  initialRelations = [],
}: {
  initialProduct?: Product;
  categories: Category[];
  initialRelations?: DraftRelation[];
}) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);
  const currency = getCurrencyLabel();

  // --- identity ------------------------------------------------------------
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [brand, setBrand] = useState(initialProduct?.brand || "");
  const [productType, setProductType] = useState(initialProduct?.product_type || "");
  const [categoryId, setCategoryId] = useState(initialProduct?.category_id || categories[0]?.id || "");
  const [shortDescription, setShortDescription] = useState(initialProduct?.short_description || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [tags, setTags] = useState<string[]>(initialProduct?.tags || []);
  const [tagDraft, setTagDraft] = useState("");

  // --- publication ---------------------------------------------------------
  const [status, setStatus] = useState<Product["status"]>(initialProduct?.status || "active");
  const [publishedAt, setPublishedAt] = useState(toLocalInput(initialProduct?.published_at));
  const [featured, setFeatured] = useState(initialProduct?.featured || false);
  const [badgeLabel, setBadgeLabel] = useState(initialProduct?.badge_label || "");
  const [badgeTone, setBadgeTone] = useState<ProductBadgeTone>(
    initialProduct?.badge_tone || "primary"
  );

  // --- pricing -------------------------------------------------------------
  const [price, setPrice] = useState(initialProduct?.price ? String(initialProduct.price) : "100");
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialProduct?.compare_at_price ? String(initialProduct.compare_at_price) : ""
  );
  const [costPrice, setCostPrice] = useState(
    initialProduct?.cost_price ? String(initialProduct.cost_price) : ""
  );
  const [salePrice, setSalePrice] = useState(
    initialProduct?.sale_price != null ? String(initialProduct.sale_price) : ""
  );
  const [saleStartsAt, setSaleStartsAt] = useState(toLocalInput(initialProduct?.sale_starts_at));
  const [saleEndsAt, setSaleEndsAt] = useState(toLocalInput(initialProduct?.sale_ends_at));

  // --- inventory -----------------------------------------------------------
  const [sku, setSku] = useState(initialProduct?.sku || `SKU-${Date.now().toString().slice(-6)}`);
  const [barcode, setBarcode] = useState(initialProduct?.barcode || "");
  const [stockQuantity, setStockQuantity] = useState(
    initialProduct?.stock_quantity !== undefined ? String(initialProduct.stock_quantity) : "25"
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialProduct?.low_stock_threshold ? String(initialProduct.low_stock_threshold) : "5"
  );
  const [trackInventory, setTrackInventory] = useState(initialProduct?.track_inventory ?? true);
  const [inventoryPolicy, setInventoryPolicy] = useState<InventoryPolicy>(
    initialProduct?.inventory_policy || "deny"
  );
  const [minQuantity, setMinQuantity] = useState(String(initialProduct?.min_purchase_quantity ?? 1));
  const [maxQuantity, setMaxQuantity] = useState(
    initialProduct?.max_purchase_quantity != null ? String(initialProduct.max_purchase_quantity) : ""
  );

  // --- shipping ------------------------------------------------------------
  const [requiresShipping, setRequiresShipping] = useState(initialProduct?.requires_shipping ?? true);
  const [weightGrams, setWeightGrams] = useState(
    initialProduct?.weight_grams != null ? String(initialProduct.weight_grams) : ""
  );
  const [lengthCm, setLengthCm] = useState(
    initialProduct?.length_cm != null ? String(initialProduct.length_cm) : ""
  );
  const [widthCm, setWidthCm] = useState(
    initialProduct?.width_cm != null ? String(initialProduct.width_cm) : ""
  );
  const [heightCm, setHeightCm] = useState(
    initialProduct?.height_cm != null ? String(initialProduct.height_cm) : ""
  );

  // --- media, options, variants, relations ---------------------------------
  const [images, setImages] = useState<Partial<ProductImage>[]>(
    (initialProduct?.images || []).filter((img) => img.url)
  );
  const [options, setOptions] = useState<ProductOption[]>(
    (initialProduct?.options || []).map((o, index) => ({ ...o, position: o.position ?? index }))
  );
  const [variants, setVariants] = useState<DraftVariant[]>(
    (initialProduct?.variants || []).map((v, index) => ({
      ...v,
      _key: v.id || `existing-${index}`,
    }))
  );
  const [relations, setRelations] = useState<DraftRelation[]>(initialRelations);

  // --- SEO -----------------------------------------------------------------
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(initialProduct?.seo_description || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Guard against losing an hour of work to a stray Cmd-W.
   *
   * Only browser-level navigation can be intercepted this way; an in-app link
   * cannot be. That is why the save bar stays pinned to the bottom of the
   * viewport instead — the reliable protection is making the save button
   * impossible to lose, not trapping the exit.
   */
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // Every state setter runs through here so "dirty" cannot drift from reality.
  const track = <T,>(setter: (value: T) => void) => (value: T) => {
    setIsDirty(true);
    setter(value);
  };

  const variantStockTotal = useMemo(
    () => variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    [variants]
  );
  const hasVariants = variants.length > 0;

  const margin = useMemo(() => {
    const sell = Number(salePrice) || Number(price) || 0;
    const cost = Number(costPrice);
    if (!Number.isFinite(cost) || cost <= 0 || sell <= 0) return null;
    return {
      profit: sell - cost,
      percent: Math.round(((sell - cost) / sell) * 100),
    };
  }, [price, salePrice, costPrice]);

  const saleIsValid = !salePrice || Number(salePrice) < Number(price);

  const scheduledFor = useMemo(() => {
    if (status !== "active" || !publishedAt) return null;
    const at = new Date(publishedAt);
    return at > new Date() ? at : null;
  }, [status, publishedAt]);

  // ------------------------------------------------------------------ images
  const handleAddImage = (url: string) => {
    setIsDirty(true);
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
    setIsDirty(true);
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.is_primary)) {
        next[0] = { ...next[0], is_primary: true };
      }
      return next.map((img, i) => ({ ...img, display_order: i }));
    });
  };

  const handleMakePrimary = (index: number) => {
    setIsDirty(true);
    setImages((prev) => prev.map((img, i) => ({ ...img, is_primary: i === index })));
  };

  /**
   * Reorder with buttons rather than drag and drop.
   *
   * Gallery order decides which photo the shopper sees second and third, so it
   * has to be editable — but a drag handle is unusable by keyboard, invisible
   * on touch, and the one interaction admins most often fumble. Two arrows do
   * the same job for everyone.
   */
  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setIsDirty(true);
    setImages((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((img, i) => ({ ...img, display_order: i }));
    });
  };

  // -------------------------------------------------------------------- tags
  const addTags = (raw: string) => {
    const incoming = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (incoming.length === 0) return;

    setIsDirty(true);
    setTags((prev) => {
      const merged = [...prev];
      for (const tag of incoming) {
        if (!merged.some((t) => t.toLowerCase() === tag.toLowerCase())) merged.push(tag);
      }
      return merged;
    });
    setTagDraft("");
  };

  const handleAutoSlug = () => {
    setIsDirty(true);
    setSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    );
  };

  // ------------------------------------------------------------------ submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        brand,
        product_type: productType.trim() || null,
        category_id: categoryId || null,
        short_description: shortDescription,
        description,
        tags,

        price: Number(price) || 0,
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        cost_price: costPrice ? Number(costPrice) : null,
        sale_price: salePrice ? Number(salePrice) : null,
        sale_starts_at: salePrice ? fromLocalInput(saleStartsAt) : null,
        sale_ends_at: salePrice ? fromLocalInput(saleEndsAt) : null,

        sku,
        barcode: barcode.trim() || null,
        // With variants present, the total is derived rather than typed.
        stock_quantity: hasVariants ? variantStockTotal : Number(stockQuantity) || 0,
        low_stock_threshold: Number(lowStockThreshold) || 5,
        track_inventory: trackInventory,
        inventory_policy: inventoryPolicy,
        min_purchase_quantity: Number(minQuantity) || 1,
        max_purchase_quantity: maxQuantity ? Number(maxQuantity) : null,

        requires_shipping: requiresShipping,
        weight_grams: weightGrams ? Number(weightGrams) : null,
        length_cm: lengthCm ? Number(lengthCm) : null,
        width_cm: widthCm ? Number(widthCm) : null,
        height_cm: heightCm ? Number(heightCm) : null,

        status,
        published_at: fromLocalInput(publishedAt),
        featured,
        // Empty means "let the storefront decide", so it is stored as null
        // rather than as an empty string.
        badge_label: badgeLabel.trim() || null,
        badge_tone: badgeTone,

        images,
        options: options.filter((o) => o.name.trim() && o.values.length > 0),
        // The client-side key is a rendering concern and must not be sent.
        variants: variants.map(({ _key, ...variant }) => variant),
        relations: relations.map(({ label, image, ...relation }) => relation),

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

      setIsDirty(false);
      setMessage("Product saved successfully!");
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 900);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
      // Errors belong where the eye already is, not above the fold of a long
      // form the merchant has scrolled past.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const seoPreviewTitle = seoTitle || name || "Product title";
  const seoPreviewDescription =
    seoDescription || shortDescription || description.slice(0, 160) || "Product description";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-28">
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

      {/* ------------------------------------------------------ 1. General -- */}
      <Section
        step={1}
        title="General product details"
        description="What the product is called and how it is described. Everything here is shopper-facing."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Title"
            name="name"
            required
            value={name}
            onChange={(e) => track(setName)(e.target.value)}
            placeholder="e.g. Cashmere Oversized Overcoat"
          />
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="URL Slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => track(setSlug)(e.target.value)}
                placeholder="cashmere-oversized-overcoat"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAutoSlug} className="mb-0.5">
              Auto Slug
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Brand Name"
            name="brand"
            value={brand}
            onChange={(e) => track(setBrand)(e.target.value)}
          />
          <Input
            label="Product Type"
            name="product_type"
            value={productType}
            onChange={(e) => track(setProductType)(e.target.value)}
            placeholder="e.g. Outerwear"
            helperText="A merchandising label, separate from the category."
          />
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
              onChange={(e) => track(setCategoryId)(e.target.value)}
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
        </div>

        <Input
          label="Short Summary"
          name="short_description"
          value={shortDescription}
          onChange={(e) => track(setShortDescription)(e.target.value)}
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
            onChange={(e) => track(setDescription)(e.target.value)}
            className="w-full rounded-brand border border-slate-300 p-3 text-xs focus:outline-none"
            placeholder="Detailed narrative describing drape, origin, craftsmanship..."
          />
        </div>

        {/* Tags ------------------------------------------------------------ */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Tags
          </label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-brand border border-slate-300 p-2">
            <TagIcon className="h-3.5 w-3.5 text-slate-400" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    setIsDirty(true);
                    setTags((prev) => prev.filter((t) => t !== tag));
                  }}
                  className="text-slate-400 hover:text-rose-600"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTags(tagDraft);
                }
              }}
              onBlur={() => addTags(tagDraft)}
              placeholder={tags.length === 0 ? "winter, wool, gift — then Enter" : "Add another"}
              className="min-w-[10rem] flex-1 border-0 text-xs focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Used by search and by filtered collections. Not shown on the product page.
          </p>
        </div>
      </Section>

      {/* -------------------------------------------------------- 2. Media -- */}
      <Section
        step={2}
        title="Media & product imagery"
        description="The first image is the one that carries the product card, search results and every feed. The rest are the gallery, in the order set here."
      >
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
              <div key={`${img.url}-${i}`} className="space-y-1.5">
                <div className="group relative aspect-[3/4] rounded-brand overflow-hidden border border-slate-200 bg-slate-50">
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

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    className="rounded border border-slate-200 p-1 text-slate-500 disabled:opacity-30 hover:bg-slate-50"
                    aria-label="Move image earlier"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === images.length - 1}
                    className="rounded border border-slate-200 p-1 text-slate-500 disabled:opacity-30 hover:bg-slate-50"
                    aria-label="Move image later"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <input
                    value={img.alt_text || ""}
                    onChange={(e) => {
                      setIsDirty(true);
                      setImages((prev) =>
                        prev.map((image, index) =>
                          index === i ? { ...image, alt_text: e.target.value } : image
                        )
                      );
                    }}
                    placeholder="Describe the photo"
                    title="Alt text: read aloud by screen readers and used by Google Images"
                    className="min-w-0 flex-1 rounded border border-slate-200 px-1.5 py-1 text-[11px] focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------ 3. Pricing -- */}
      <Section
        step={3}
        title="Pricing"
        description="The regular price is never overwritten by a sale. When a scheduled markdown ends, the price below returns on its own."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={`Regular Price (${currency})`}
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => track(setPrice)(e.target.value)}
          />
          <Input
            label={`Compare-at Price (${currency})`}
            name="compare_at_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 650.00"
            value={compareAtPrice}
            onChange={(e) => track(setCompareAtPrice)(e.target.value)}
            helperText="Shown struck through when higher than the price."
          />
          <Input
            label={`Cost Price (${currency})`}
            name="cost_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 180.00"
            value={costPrice}
            onChange={(e) => track(setCostPrice)(e.target.value)}
            helperText={
              margin
                ? `Margin ${margin.percent}% — ${margin.profit.toFixed(2)} ${currency} per unit.`
                : "Never shown to customers."
            }
          />
        </div>

        <div className="rounded-brand border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Scheduled sale
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Set a sale price and, optionally, when it runs. The markdown starts and ends by
              itself — nobody has to remember to put the price back on Monday morning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={`Sale Price (${currency})`}
              type="number"
              step="0.01"
              min="0"
              value={salePrice}
              onChange={(e) => track(setSalePrice)(e.target.value)}
              error={!saleIsValid ? "Must be below the regular price." : undefined}
            />
            <Input
              label="Starts"
              type="datetime-local"
              value={saleStartsAt}
              disabled={!salePrice}
              onChange={(e) => track(setSaleStartsAt)(e.target.value)}
              helperText="Blank = immediately"
            />
            <Input
              label="Ends"
              type="datetime-local"
              value={saleEndsAt}
              disabled={!salePrice}
              onChange={(e) => track(setSaleEndsAt)(e.target.value)}
              helperText="Blank = until removed"
            />
          </div>

          {salePrice && saleIsValid && (
            <p className="text-[11px] font-semibold text-emerald-800">
              Shoppers will see {Number(salePrice).toFixed(2)} {currency} with{" "}
              {Number(price).toFixed(2)} {currency} struck through —{" "}
              {Math.floor(((Number(price) - Number(salePrice)) / Number(price)) * 100)}% off.
            </p>
          )}
        </div>
      </Section>

      {/* ---------------------------------------------------- 4. Inventory -- */}
      <Section
        step={4}
        title="Inventory & purchase limits"
        description="How stock is counted, and what happens when it runs out."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Master SKU"
            name="sku"
            required
            value={sku}
            onChange={(e) => track(setSku)(e.target.value)}
          />
          <Input
            label="Barcode (GTIN / UPC / EAN)"
            value={barcode}
            onChange={(e) => track(setBarcode)(e.target.value)}
            placeholder="5012345678900"
            helperText="Required by Google Shopping for branded goods."
          />
          <Input
            label="Low Stock Warning Threshold"
            name="low_stock_threshold"
            type="number"
            min="0"
            value={lowStockThreshold}
            onChange={(e) => track(setLowStockThreshold)(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Total Stock Quantity"
            name="stock_quantity"
            type="number"
            min="0"
            required={!hasVariants && trackInventory}
            disabled={hasVariants || !trackInventory}
            value={hasVariants ? String(variantStockTotal) : stockQuantity}
            onChange={(e) => track(setStockQuantity)(e.target.value)}
            helperText={
              !trackInventory
                ? "Not tracked — this product never runs out."
                : hasVariants
                  ? "Calculated from the variant grid below."
                  : "Add options below to track stock per variant instead."
            }
          />
          <Input
            label="Minimum per order"
            type="number"
            min="1"
            value={minQuantity}
            onChange={(e) => track(setMinQuantity)(e.target.value)}
            helperText="For products sold in pairs or packs."
          />
          <Input
            label="Maximum per order"
            type="number"
            min="1"
            value={maxQuantity}
            onChange={(e) => track(setMaxQuantity)(e.target.value)}
            placeholder="No limit"
            helperText="Protects a small drop from one buyer."
          />
        </div>

        <div className="space-y-3 rounded-brand border border-slate-200 bg-slate-50 p-4">
          <Toggle
            checked={trackInventory}
            onChange={track(setTrackInventory)}
            label="Track stock for this product"
            help="Turn off for services, downloads and made-to-order lines that never run out."
          />

          {trackInventory && (
            <div className="space-y-1.5 pl-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                When stock reaches zero
              </label>
              <select
                value={inventoryPolicy}
                onChange={(e) => track(setInventoryPolicy)(e.target.value as InventoryPolicy)}
                className="w-full max-w-md rounded-brand border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none"
              >
                <option value="deny">Stop selling — show as out of stock</option>
                <option value="continue">Keep selling — accept backorders</option>
              </select>
              <p className="text-[11px] text-slate-500">
                {inventoryPolicy === "continue"
                  ? "The product stays buyable and the shopper is told at checkout that it will ship when restocked."
                  : "The add-to-cart button becomes a back-in-stock sign-up."}
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* ----------------------------------------------------- 5. Variants -- */}
      <Section
        step={5}
        title="Options & variants"
        description="Define what the product varies by — size, colour, material — and every combination is generated for you, each with its own SKU, price and stock."
      >
        <VariantMatrix
          options={options}
          onOptionsChange={track(setOptions)}
          variants={variants}
          onVariantsChange={track(setVariants)}
          baseSku={sku}
          basePrice={price}
          baseStock={stockQuantity}
          currency={currency}
        />
      </Section>

      {/* ----------------------------------------------------- 6. Shipping -- */}
      <Section
        step={6}
        title="Shipping"
        description="Used by delivery rates, packing slips and the specs shown on the product page."
      >
        <Toggle
          checked={requiresShipping}
          onChange={track(setRequiresShipping)}
          label="This is a physical product that needs delivering"
          help="Turn off for downloads, services and gift cards — a cart holding only these is never charged delivery."
        />

        {requiresShipping && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <Input
              label="Weight (g)"
              type="number"
              min="0"
              value={weightGrams}
              onChange={(e) => track(setWeightGrams)(e.target.value)}
            />
            <Input
              label="Length (cm)"
              type="number"
              step="0.1"
              min="0"
              value={lengthCm}
              onChange={(e) => track(setLengthCm)(e.target.value)}
            />
            <Input
              label="Width (cm)"
              type="number"
              step="0.1"
              min="0"
              value={widthCm}
              onChange={(e) => track(setWidthCm)(e.target.value)}
            />
            <Input
              label="Height (cm)"
              type="number"
              step="0.1"
              min="0"
              value={heightCm}
              onChange={(e) => track(setHeightCm)(e.target.value)}
            />
          </div>
        )}
      </Section>

      {/* ------------------------------------------------- 7. Merchandising -- */}
      <Section
        step={7}
        title="Merchandising"
        description="How this product is promoted across the storefront, and what it is shown alongside."
      >
        <Toggle
          checked={featured}
          onChange={track(setFeatured)}
          label="Feature this product on homepage curations"
        />

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
              onChange={(e) => track(setBadgeLabel)(e.target.value)}
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
                onChange={(e) => track(setBadgeTone)(e.target.value as ProductBadgeTone)}
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

        <div className="rounded-brand border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
            Related products
          </h3>
          <RelatedProductsPicker
            productId={initialProduct?.id}
            relations={relations}
            onChange={track(setRelations)}
          />
        </div>
      </Section>

      {/* ---------------------------------------------------------- 8. SEO -- */}
      <Section
        step={8}
        title="Search engine listing"
        description="What Google shows. Leave blank and the product title and summary are used."
      >
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="SEO Title"
            value={seoTitle}
            onChange={(e) => track(setSeoTitle)(e.target.value)}
            placeholder={name || "Product title"}
            helperText={`${seoPreviewTitle.length} characters — Google truncates around 60.`}
          />
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="seo_description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              SEO Description
            </label>
            <textarea
              id="seo_description"
              rows={2}
              value={seoDescription}
              onChange={(e) => track(setSeoDescription)(e.target.value)}
              placeholder={shortDescription || "One or two sentences a searcher would click."}
              className="w-full rounded-brand border border-slate-300 p-3 text-xs focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              {seoPreviewDescription.length} characters — Google truncates around 160.
            </p>
          </div>
        </div>

        {/* A live snippet, so the first sight of the listing is not on Google. */}
        <div className="rounded-brand border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Google preview
          </p>
          <p className="truncate text-[11px] text-slate-600">
            {getSiteUrl()}/products/{slug || "product-slug"}
          </p>
          <p className="truncate text-base text-[#1a0dab]">{seoPreviewTitle.slice(0, 60)}</p>
          <p className="line-clamp-2 text-xs text-slate-600">
            {seoPreviewDescription.slice(0, 160)}
          </p>
        </div>
      </Section>

      {/* --------------------------------------------------- sticky savebar -- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_-2px_12px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => track(setStatus)(e.target.value as Product["status"])}
            className="rounded-brand border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
            aria-label="Publish status"
          >
            <option value="active">Active (visible)</option>
            <option value="draft">Draft (hidden)</option>
            <option value="archived">Archived</option>
          </select>

          {status === "active" && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Publish at</span>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => track(setPublishedAt)(e.target.value)}
                className="rounded-brand border border-slate-300 px-2 py-1.5 text-xs focus:outline-none"
              />
            </label>
          )}

          {scheduledFor && (
            <span className="text-[11px] font-semibold text-amber-700">
              Hidden until {scheduledFor.toLocaleString()}
            </span>
          )}

          {isDirty && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" /> Unsaved changes
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="outline" size="md" onClick={() => router.push("/admin/products")}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={!saleIsValid}
              className="shadow-sm"
            >
              Save Product
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
