"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Mail, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/storefront/ProductImage";
import { formatPrice } from "@/lib/config/store.config";
import { ORDER_JOURNEY, orderStatusLabel } from "@/lib/orders/status";
import type { OrderStatus } from "@/types/database";

interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  placedAt: string;
  currency: string;
  total: number;
  estimatedDelivery: string | null;
  shippingCity: string | null;
  history: { status: OrderStatus; createdAt: string }[];
  items: { name: string; quantity: number; image: string | null }[];
}

export function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload?.error?.message || "We could not find that order.");
        return;
      }

      setOrder(payload.data);
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = order ? ORDER_JOURNEY.indexOf(order.status) : -1;

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6"
      >
        {error && (
          <p role="alert" className="flex gap-2 rounded-brand bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}

        <Input
          label="Order number"
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          placeholder="e.g. ORD-123456789"
          leftIcon={<Package className="h-4 w-4" />}
          helperText="On your confirmation email, at the top of the receipt."
          required
        />

        <Input
          type="email"
          label="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          leftIcon={<Mail className="h-4 w-4" />}
          helperText="The address you used when placing the order."
          required
        />

        <Button type="submit" size="lg" isLoading={loading} className="w-full sm:w-auto">
          <Search className="h-4 w-4" /> Track my order
        </Button>
      </form>

      {order && (
        <section className="overflow-hidden rounded-brand-xl border border-brand-border bg-white shadow-subtle">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border bg-brand-subtle/60 p-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-faint-ink">
                Order
              </span>
              <p className="font-heading text-lg font-bold text-brand-ink">#{order.orderNumber}</p>
              <p className="text-xs text-brand-muted-ink">
                Placed {new Date(order.placedAt).toLocaleDateString()}
                {order.shippingCity ? ` · Shipping to ${order.shippingCity}` : ""}
              </p>
            </div>
            <div className="text-right">
              <span className="rounded-brand-full bg-brand-success/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-primary">
                {order.statusLabel}
              </span>
              <p className="mt-2 text-sm font-bold text-brand-ink">
                {formatPrice(order.total, order.currency)}
              </p>
            </div>
          </header>

          {/* Horizontal progress rail — reads at a glance, which is the whole
              point of a tracking page. */}
          {currentIndex >= 0 && (
            <ol className="flex overflow-x-auto border-b border-brand-border p-5">
              {ORDER_JOURNEY.map((step, index) => {
                const reached = index <= currentIndex;
                return (
                  <li key={step} className="flex min-w-[7rem] flex-1 flex-col items-center gap-2">
                    <div className="flex w-full items-center">
                      <span
                        className={`h-0.5 flex-1 ${
                          index === 0 ? "bg-transparent" : reached ? "bg-brand-primary" : "bg-brand-border"
                        }`}
                      />
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                          reached
                            ? "border-brand-success bg-brand-success text-white"
                            : "border-brand-border bg-white text-brand-faint-ink"
                        }`}
                      >
                        {reached ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <span
                        className={`h-0.5 flex-1 ${
                          index === ORDER_JOURNEY.length - 1
                            ? "bg-transparent"
                            : index < currentIndex
                              ? "bg-brand-primary"
                              : "bg-brand-border"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-center text-[11px] font-semibold ${
                        reached ? "text-brand-ink" : "text-brand-faint-ink"
                      }`}
                    >
                      {orderStatusLabel(step)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {order.estimatedDelivery && (
            <p className="border-b border-brand-border px-5 py-3 text-sm text-brand-muted-ink">
              Estimated delivery:{" "}
              <span className="font-semibold text-brand-ink">{order.estimatedDelivery}</span>
            </p>
          )}

          <ul className="divide-y divide-brand-border">
            {order.items.map((item, index) => (
              <li key={index} className="flex items-center gap-3 px-5 py-3">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-brand border border-brand-border bg-brand-subtle">
                  <ProductImage
                    src={item.image}
                    seed={item.name}
                    alt=""
                    sizes="48px"
                    compact
                    className="object-cover"
                  />
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-brand-ink">{item.name}</span>
                <span className="text-xs text-brand-faint-ink">×{item.quantity}</span>
              </li>
            ))}
          </ul>

          <footer className="border-t border-brand-border bg-brand-subtle/60 px-5 py-4 text-xs text-brand-muted-ink">
            Something not right?{" "}
            <Link href="/contact" className="font-semibold text-brand-primary hover:underline">
              Contact support
            </Link>{" "}
            with your order number.
          </footer>
        </section>
      )}
    </div>
  );
}
