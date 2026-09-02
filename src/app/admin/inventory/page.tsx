"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, History, ChevronDown, ChevronRight } from "lucide-react";
import { InventoryTransaction, Product, ProductVariant } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

/** Which row the adjust modal is currently pointed at. */
interface AdjustTarget {
  product: Product;
  variant?: ProductVariant;
}

function describeVariant(variant: ProductVariant): string {
  const attrs = Object.entries(variant.attributes || {});
  if (attrs.length === 0) return variant.sku;
  return attrs.map(([key, value]) => `${key}: ${value}`).join(", ");
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [target, setTarget] = useState<AdjustTarget | null>(null);
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("Restock shipment received");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notify = (tone: "ok" | "error", text: string) => {
    setFeedback({ tone, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inventory", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products || []);
        setHistory(data.data.history || []);
      } else {
        notify("error", data.error?.message || "Could not load inventory.");
      }
    } catch {
      notify("error", "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  /** Product name lookup so the ledger can show what moved, not just an id. */
  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p.id, p.name);
    return map;
  }, [products]);

  const variantLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      for (const v of p.variants || []) map.set(v.id, describeVariant(v));
    }
    return map;
  }, [products]);

  const openAdjust = (product: Product, variant?: ProductVariant) => {
    setTarget({ product, variant });
    setNewStock(String(variant ? variant.stock : product.stock_quantity));
    setReason("Restock shipment received");
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: target.product.id,
          variantId: target.variant?.id ?? null,
          newQuantity: Number(newStock) || 0,
          reason,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Stock adjustment failed.");
      }

      const label = target.variant ? `${target.product.name} (${describeVariant(target.variant)})` : target.product.name;
      setTarget(null);
      notify("ok", `${label} set to ${Number(newStock) || 0} units.`);
      await fetchInventory();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
          Stock Control &amp; Audit
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Live Inventory Management
        </h1>
      </div>

      {feedback && (
        <div
          className={`rounded-brand border p-3 text-xs font-semibold ${
            feedback.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Main Stock Table */}
      <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Archive className="h-5 w-5 text-slate-700" /> Stock Levels by Product
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {products.length} products monitored
          </span>
        </div>

        {isLoading ? (
          <p className="p-8 text-center text-xs text-slate-400">Loading inventory…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product / Size</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Available Stock</th>
                  <th className="py-3.5 px-4">Threshold</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const variants = (product.variants || []).filter((v) => v.is_active !== false);
                  const hasVariants = variants.length > 0;
                  const isOpen = Boolean(expanded[product.id]);
                  const isLow = product.stock_quantity <= product.low_stock_threshold;
                  const isOut = product.stock_quantity === 0;

                  return (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            {hasVariants ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpanded((prev) => ({ ...prev, [product.id]: !isOpen }))
                                }
                                className="rounded p-0.5 text-slate-400 hover:text-slate-900"
                                aria-expanded={isOpen}
                                aria-label={`${isOpen ? "Hide" : "Show"} sizes for ${product.name}`}
                              >
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <span className="w-5" />
                            )}
                            <span>{product.name}</span>
                            {hasVariants && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                {variants.length} sizes
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{product.sku}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-sm font-bold ${
                              isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-900"
                            }`}
                          >
                            {product.stock_quantity} units
                          </span>
                          {hasVariants && (
                            <span className="ml-1 text-[10px] text-slate-400">(all sizes)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {product.low_stock_threshold} units
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={isOut ? "danger" : isLow ? "warning" : "success"} size="sm">
                            {isOut ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "IN STOCK"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {hasVariants ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setExpanded((prev) => ({ ...prev, [product.id]: true }))
                              }
                              className="text-xs"
                            >
                              Adjust by size
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAdjust(product)}
                              className="text-xs"
                            >
                              Adjust Stock
                            </Button>
                          )}
                        </td>
                      </tr>

                      {hasVariants &&
                        isOpen &&
                        variants.map((variant) => {
                          const vOut = variant.stock === 0;
                          const vLow = variant.stock <= product.low_stock_threshold;

                          return (
                            <tr key={variant.id} className="bg-slate-50/60">
                              <td className="py-2.5 px-4 pl-14 font-semibold text-slate-700">
                                {describeVariant(variant)}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-400">{variant.sku}</td>
                              <td className="py-2.5 px-4">
                                <span
                                  className={`font-bold ${
                                    vOut ? "text-rose-600" : vLow ? "text-amber-600" : "text-slate-800"
                                  }`}
                                >
                                  {variant.stock} units
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-slate-400">—</td>
                              <td className="py-2.5 px-4">
                                <Badge
                                  variant={vOut ? "danger" : vLow ? "warning" : "success"}
                                  size="sm"
                                >
                                  {vOut ? "OUT" : vLow ? "LOW" : "IN STOCK"}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => openAdjust(product, variant)}
                                  className="text-xs"
                                >
                                  Adjust
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory Transactions Audit History */}
      <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-slate-700" /> Transaction &amp; Audit Log
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {history.length} movements recorded
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No stock movements recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Quantity Change</th>
                  <th className="py-3.5 px-4">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.slice(0, 25).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {productNameById.get(tx.product_id) || "—"}
                      {tx.variant_id && (
                        <span className="block text-[10px] text-slate-400">
                          {variantLabelById.get(tx.variant_id) || "variant"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-slate-800">
                      {tx.transaction_type}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-bold ${
                          tx.quantity_change < 0
                            ? "text-rose-600"
                            : tx.quantity_change > 0
                            ? "text-emerald-600"
                            : "text-slate-400"
                        }`}
                      >
                        {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{tx.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Stock Adjust Modal */}
      <Modal
        isOpen={Boolean(target)}
        onClose={() => setTarget(null)}
        title={
          target?.variant
            ? `Adjust ${target.product.name} — ${describeVariant(target.variant)}`
            : `Adjust Stock: ${target?.product.name ?? ""}`
        }
        description="Enter the new total on hand. The difference is written to the audit log."
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 mt-4">
          <Input
            label="New Total Stock Quantity"
            type="number"
            min="0"
            step="1"
            required
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            helperText={
              target?.variant
                ? "Applies to this size only. The product total is recalculated from all sizes."
                : undefined
            }
          />
          <Input
            label="Reason / Purchase Order Note"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Warehouse restock shipment #401"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Apply Stock Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
