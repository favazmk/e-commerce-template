"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Tag, X } from "lucide-react";
import type { Category, Product } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/config/store.config";
import { effectivePrice, isSaleWindowActive, scheduledPublishAt } from "@/lib/commerce/selling-rules";
import { ProductRowActions } from "./ProductRowActions";

/**
 * The catalogue table, with selection and bulk actions.
 *
 * Seasonal merchandising is not done one product at a time. "Archive last
 * winter's forty", "feature these twelve", "take 20% off the sale rail" are
 * single decisions, and without a bulk bar each one becomes forty page loads —
 * which is how catalogues end up half-migrated.
 *
 * Bulk delete is deliberately absent. It is unrecoverable and cascades through
 * variants, images and the stock ledger; archiving reaches the same shelf and
 * can be undone.
 */
export function ProductTable({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");

  const allSelected = products.length > 0 && selected.size === products.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const apply = async (changes: Record<string, unknown>, confirmMessage?: string) => {
    if (selected.size === 0) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setIsApplying(true);
    setError("");

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), ...changes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "That change could not be applied.");
      }

      setSelected(new Set());
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <div className="space-y-3">
      {/* ------------------------------------------------------- bulk bar --- */}
      {selectedCount > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-brand-xl border border-slate-900/10 bg-slate-900 px-4 py-3 text-white shadow-lg">
          <span className="text-xs font-bold">
            {selectedCount} selected
          </span>

          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="ml-2 flex flex-wrap items-center gap-1.5">
            <BulkButton onClick={() => apply({ status: "active" })} disabled={isApplying}>
              Publish
            </BulkButton>
            <BulkButton onClick={() => apply({ status: "draft" })} disabled={isApplying}>
              Move to draft
            </BulkButton>
            <BulkButton
              onClick={() =>
                apply(
                  { status: "archived" },
                  `Archive ${selectedCount} product${selectedCount === 1 ? "" : "s"}? They come off the storefront but keep all their data.`
                )
              }
              disabled={isApplying}
            >
              Archive
            </BulkButton>
            <BulkButton onClick={() => apply({ featured: true })} disabled={isApplying}>
              Feature
            </BulkButton>
            <BulkButton onClick={() => apply({ featured: false })} disabled={isApplying}>
              Unfeature
            </BulkButton>

            <select
              onChange={(e) => {
                if (!e.target.value) return;
                apply({ category_id: e.target.value });
                e.target.value = "";
              }}
              disabled={isApplying}
              defaultValue=""
              className="rounded-brand border border-white/20 bg-white/10 px-2 py-1.5 text-xs font-semibold text-white focus:outline-none"
              aria-label="Move to category"
            >
              <option value="" className="text-slate-900">
                Move to category…
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="text-slate-900">
                  {category.name}
                </option>
              ))}
            </select>

            <select
              onChange={(e) => {
                const percent = Number(e.target.value);
                if (!percent) return;
                apply(
                  { price_change_percent: percent },
                  `Change the price of ${selectedCount} product${selectedCount === 1 ? "" : "s"} by ${percent > 0 ? "+" : ""}${percent}%? This rewrites the regular price and cannot be undone in one step.`
                );
                e.target.value = "";
              }}
              disabled={isApplying}
              defaultValue=""
              className="rounded-brand border border-white/20 bg-white/10 px-2 py-1.5 text-xs font-semibold text-white focus:outline-none"
              aria-label="Adjust price"
            >
              <option value="" className="text-slate-900">
                Adjust price…
              </option>
              {[-30, -20, -10, 10, 20].map((percent) => (
                <option key={percent} value={percent} className="text-slate-900">
                  {percent > 0 ? "+" : ""}
                  {percent}%
                </option>
              ))}
            </select>
          </div>

          {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )}

      {error && (
        <p className="rounded-brand border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      {/* ---------------------------------------------------------- table --- */}
      <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3.5 px-4 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)))
                    }
                    aria-label="Select all products"
                  />
                </th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Inventory</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const pricing = effectivePrice(product);
                const scheduled = scheduledPublishAt(product);
                const onSale = isSaleWindowActive(product);
                const untracked = product.track_inventory === false;

                return (
                  <tr
                    key={product.id}
                    className={`transition-colors ${
                      selected.has(product.id) ? "bg-emerald-50/60" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggle(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 rounded-brand bg-slate-100 overflow-hidden border border-slate-100">
                          {product.images?.[0]?.url && (
                            <Image
                              fill
                              sizes="40px"
                              src={product.images[0].url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="font-bold text-slate-900 hover:text-emerald-600 truncate max-w-xs block"
                          >
                            {product.name}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {product.brand || "—"}
                            {product.variants && product.variants.length > 0 && (
                              <> · {product.variants.length} variants</>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {product.category?.name || "Unassigned"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">{product.sku}</td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">
                        {formatPrice(pricing.price)}
                      </span>
                      {onSale && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600">
                          <Tag className="h-3 w-3" />
                          {pricing.discountPercent}% off
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {untracked ? (
                        <span className="text-slate-400">Not tracked</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            product.stock_quantity === 0
                              ? "text-rose-600"
                              : product.stock_quantity <= product.low_stock_threshold
                                ? "text-amber-600"
                                : "text-slate-800"
                          }`}
                        >
                          {product.stock_quantity} in stock
                          {product.stock_quantity === 0 &&
                            product.inventory_policy === "continue" && (
                              <span className="ml-1 font-normal text-slate-500">
                                (backorder)
                              </span>
                            )}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {scheduled ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700"
                          title={`Goes live ${scheduled.toLocaleString()}`}
                        >
                          <Clock className="h-3 w-3" /> Scheduled
                        </span>
                      ) : (
                        <Badge variant={product.status === "active" ? "success" : "default"} size="sm">
                          {product.status}
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <ProductRowActions
                        productId={product.id}
                        productName={product.name}
                        productSlug={product.slug}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BulkButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
    >
      {children}
    </Button>
  );
}
