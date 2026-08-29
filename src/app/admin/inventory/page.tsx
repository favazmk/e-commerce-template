"use client";

import React, { useState, useEffect } from "react";
import { Archive, Plus, History, AlertTriangle, CheckCircle2 } from "lucide-react";
import { InventoryTransaction, Product } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<InventoryTransaction[]>([]);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("Restock shipment received");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
        setHistory(data.data.history);
      }
    } catch (e) {
      console.error("Failed to load inventory", e);
    }
  };

  const openAdjust = (product: Product) => {
    setSelectedProduct(product);
    setNewStock(String(product.stock_quantity));
    setIsAdjustModalOpen(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          newQuantity: Number(newStock) || 0,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAdjustModalOpen(false);
        fetchInventory();
      }
    } catch (e) {
      console.error("Stock adjustment failed", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
          Stock Control & Audit
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Live Inventory Management
        </h1>
      </div>

      {/* Main Stock Table */}
      <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Archive className="h-5 w-5 text-slate-700" /> Stock Levels by Product
          </h2>
          <span className="text-xs text-slate-400 font-medium">{products.length} Products Monitored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Available Stock</th>
                <th className="py-3.5 px-4">Threshold</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const isLow = product.stock_quantity <= product.low_stock_threshold;
                const isOut = product.stock_quantity === 0;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{product.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{product.sku}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-sm font-bold ${
                          isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-900"
                        }`}
                      >
                        {product.stock_quantity} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{product.low_stock_threshold} units</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={isOut ? "danger" : isLow ? "warning" : "success"}
                        size="sm"
                      >
                        {isOut ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "IN STOCK"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAdjust(product)}
                        className="text-xs"
                      >
                        Adjust Stock
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Transactions Audit History */}
      <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-slate-700" /> Transaction & Audit Log
          </h2>
          <span className="text-xs text-slate-400 font-medium">Recorded Ledger</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No stock movements recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Quantity Delta</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {history.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-slate-800">
                      {tx.transaction_type}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          tx.quantity_change < 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{tx.reference_id || "N/A"}</td>
                    <td className="py-3 px-4 font-sans text-slate-700">{tx.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Stock Adjust Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
        description="Update inventory count. A permanent audit log transaction will be generated."
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 mt-4">
          <Input
            label="New Total Stock Quantity"
            type="number"
            required
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
          />
          <Input
            label="Reason / Purchase Order Note"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Warehouse restock shipment #401"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdjustModalOpen(false)}
            >
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
