import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Package } from "lucide-react";
import { OrderService } from "@/services/order.service";
import { getSessionUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/config/store.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/storefront/ProductImage";
import { orderStatusLabel, orderStatusTone } from "@/lib/orders/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const user = await getSessionUser();
  if (!user) return null;

  // Scoped to the session user id. Never accept an id from the URL here.
  const orders = await OrderService.getUserOrders(user.id);

  if (orders.length === 0) {
    return (
      <div className="rounded-brand-xl border border-slate-200 bg-white p-10 text-center shadow-subtle">
        <Package className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 font-heading text-lg font-bold text-slate-900">No orders yet</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          When you place an order it will appear here with live tracking, receipts and a one-tap
          reorder.
        </p>
        <Link href="/products" className="mt-6 inline-block">
          <Button>Browse the collection</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-slate-900">My orders</h1>
        <span className="text-xs font-medium text-slate-400">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </span>
      </div>

      {orders.map((order) => (
        <article
          key={order.id}
          className="overflow-hidden rounded-brand-xl border border-slate-200 bg-white shadow-subtle transition-colors hover:border-slate-300"
        >
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Order
              </span>
              <p className="text-sm font-bold text-slate-900">#{order.order_number}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Placed
              </span>
              <p className="text-xs text-slate-700">
                {new Date(order.created_at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status
              </span>
              <div className="mt-0.5">
                <Badge variant={orderStatusTone(order.status)} size="sm">
                  {orderStatusLabel(order.status)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total
              </span>
              <p className="text-sm font-bold text-slate-900">
                {formatPrice(order.total_amount, order.currency)}
              </p>
            </div>
          </header>

          <div className="space-y-3 px-5 py-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-brand border border-slate-100 bg-slate-50">
                  <ProductImage
                    src={item.image_snapshot}
                    seed={item.product_name_snapshot}
                    alt=""
                    sizes="56px"
                    compact
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-semibold text-slate-900">
                    {item.product_name_snapshot}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Qty {item.quantity} &bull;{" "}
                    {formatPrice(item.price_snapshot, order.currency)} each
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {formatPrice(item.total_price, order.currency)}
                </span>
              </div>
            ))}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-xs">
            <span className="text-slate-500">
              Shipping to {order.shipping_address.city}, {order.shipping_address.country}
            </span>
            <Link
              href={`/account/orders/${order.order_number}`}
              className="flex items-center gap-1 font-bold text-emerald-600 hover:underline"
            >
              Track &amp; view invoice <ArrowRight className="h-3 w-3" />
            </Link>
          </footer>
        </article>
      ))}
    </div>
  );
}
