"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Package, Check, RefreshCw } from "lucide-react";
import { Order, OrderStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { formatPrice } from "@/lib/config/store.config";

export function OrderDetailClient({ initialOrder }: { initialOrder: Order }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(initialOrder.status);
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          status: selectedStatus,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setMessage("Order status updated successfully!");
        setNotes("");
      }
    } catch (e: any) {
      setMessage(`Failed: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/admin/orders"
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading text-slate-900">
              Order #{order.order_number}
            </h1>
            <Badge
              variant={
                order.status === "delivered"
                  ? "success"
                  : order.status === "cancelled"
                  ? "danger"
                  : "warning"
              }
              size="md"
            >
              {order.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-brand bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
          {message}
        </div>
      )}

      {/* Grid: Details & Status Transition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Items & Financials (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Order Items snapshot */}
          <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-center">
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-brand bg-slate-100 overflow-hidden border border-slate-100">
                    {item.image_snapshot && (
                      <Image fill sizes="64px"
                        src={item.image_snapshot}
                        alt={item.product_name_snapshot}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {item.product_name_snapshot}
                    </h4>
                    <p className="text-xs text-slate-400">
                      SKU: {item.sku_snapshot} • Qty: {item.quantity} × {formatPrice(item.price_snapshot, order.currency)}
                    </p>
                    {item.attributes_snapshot && (
                      <div className="mt-1 flex gap-2 text-[11px] text-slate-500">
                        {Object.entries(item.attributes_snapshot).map(([k, v]) => (
                          <span key={k}>
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {formatPrice(item.total_price, order.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPrice(order.subtotal, order.currency)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({order.coupon_code})</span>
                  <span>-{formatPrice(order.discount_amount, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping ({order.shipping_method?.title || "Courier"})</span>
                <span className="font-semibold text-slate-900">
                  {order.shipping_amount === 0 ? "FREE" : formatPrice(order.shipping_amount, order.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span className="font-semibold text-slate-900">{formatPrice(order.tax_amount, order.currency)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-slate-900">
                <span>Grand Total</span>
                <span>{formatPrice(order.total_amount, order.currency)}</span>
              </div>
            </div>
          </div>

          {/* Timeline & Status History */}
          <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-600" /> Lifecycle Status History
            </h3>
            <div className="space-y-4 pt-2">
              {order.history?.map((h, i) => (
                <div key={h.id || i} className="flex items-start gap-3 text-xs">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 uppercase">{h.status}</p>
                    <p className="text-slate-500">{h.notes || "Status transitioned"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Status Transition & Customer Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Update Form */}
          <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Update Order Status
            </h3>
            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-slate-700">Next Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full rounded-brand border border-slate-300 bg-white p-2.5 text-xs focus:outline-none uppercase font-semibold"
                >
                  <option value="pending">PENDING</option>
                  <option value="paid">PAID</option>
                  <option value="confirmed">CONFIRMED</option>
                  <option value="processing">PROCESSING</option>
                  <option value="packed">PACKED</option>
                  <option value="shipped">SHIPPED</option>
                  <option value="out_for_delivery">OUT FOR DELIVERY</option>
                  <option value="delivered">DELIVERED</option>
                  <option value="cancelled">CANCELLED</option>
                  <option value="refunded">REFUNDED</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-slate-700">
                  Status Note / Courier Tracking #
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dispatched via DHL Express Tracking #98214"
                  className="w-full rounded-brand border border-slate-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                className="w-full text-xs font-bold"
              >
                Update Status
              </Button>
            </form>
          </div>

          {/* Customer & Shipping Card */}
          <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Shipping & Recipient
            </h3>
            <div className="text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              <p>{order.shipping_address.address_1}</p>
              {order.shipping_address.address_2 && <p>{order.shipping_address.address_2}</p>}
              <p>
                {order.shipping_address.city}, {order.shipping_address.state}{" "}
                {order.shipping_address.postal_code}
              </p>
              <p>{order.shipping_address.country}</p>
              <p className="pt-2 font-medium">Contact: {order.shipping_address.phone}</p>
              <p className="font-medium">Email: {order.guest_email || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
