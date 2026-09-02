import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, MapPin, Heart, Shield, ArrowRight } from "lucide-react";
import { OrderService } from "@/services/order.service";
import { getSessionUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/config/store.config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function CustomerAccountPage() {
  // Identity comes from the session. Never render another customer's orders.
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?redirectTo=/account");
  }

  const orders = await OrderService.getUserOrders(user.id);
  const latestAddress = orders.find((o) => o.shipping_address)?.shipping_address;
  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
  const initials = (user.name || user.email || "?")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Account Profile Header */}
      <div className="rounded-brand-xl bg-slate-900 text-white p-6 sm:p-8 mb-10 shadow-float flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative h-20 w-20 rounded-full bg-slate-800 border-2 border-emerald-500 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {user.avatar_url ? (
            <Image fill sizes="80px" src={user.avatar_url} alt="" className="object-cover" />
          ) : (
            <span className="text-lg font-bold text-emerald-400">{initials}</span>
          )}
        </div>
        <div className="flex-1 text-center md:text-left min-w-0">
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
            Account
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading mt-1 break-words">
            {user.name || "Welcome back"}
          </h1>
          <p className="text-xs text-slate-400 mt-1 break-all">
            {user.email} &bull; Member since {memberSince}
          </p>
        </div>
      </div>

      {/* Main Grid: Orders & Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Orders List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-700" /> Order History &amp; Tracking
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {orders.length} {orders.length === 1 ? "Order" : "Orders"} Placed
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-brand-xl border border-slate-200 p-8 text-center bg-white">
              <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900">No Orders Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Once you complete a purchase, your orders will appear here.
              </p>
              <Link href="/products" className="mt-4 inline-block">
                <Button size="sm" variant="primary">
                  Shop Collection
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-brand-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-subtle hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold uppercase">Order</span>
                      <p className="text-sm font-bold text-slate-900">#{order.order_number}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold uppercase">Date</span>
                      <p className="text-xs text-slate-700">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold uppercase">Status</span>
                      <div>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "success"
                              : order.status === "cancelled"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase">Total</span>
                      <p className="text-sm font-bold text-slate-900">
                        {formatPrice(order.total_amount, order.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items snapshot summary */}
                  <div className="py-4 space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-brand bg-slate-100 overflow-hidden flex-shrink-0">
                          {item.image_snapshot && (
                            <Image
                              fill
                              sizes="48px"
                              src={item.image_snapshot}
                              alt=""
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">
                            {item.product_name_snapshot}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Qty: {item.quantity} &bull;{" "}
                            {formatPrice(item.price_snapshot, order.currency)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">
                      Shipped to: {order.shipping_address.city}, {order.shipping_address.country}
                    </span>
                    <Link
                      href={`/checkout/success/${order.order_number}`}
                      className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      View Receipt &amp; Timeline <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Saved Addresses & Shortcuts (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Address Book */}
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" /> Default Shipping Address
            </h3>
            {latestAddress ? (
              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-4 rounded-brand border border-slate-100">
                <p className="font-semibold text-slate-900">
                  {latestAddress.first_name} {latestAddress.last_name}
                </p>
                <p>{latestAddress.address_1}</p>
                {latestAddress.address_2 && <p>{latestAddress.address_2}</p>}
                <p>
                  {latestAddress.city}, {latestAddress.state} {latestAddress.postal_code}
                </p>
                <p>{latestAddress.country}</p>
                {latestAddress.phone && <p>Phone: {latestAddress.phone}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-brand border border-slate-100">
                No saved address yet. The address you use at checkout will appear here.
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">
              Account Shortcuts
            </h3>
            <Link
              href="/wishlist"
              className="flex items-center justify-between text-xs text-slate-700 hover:text-emerald-600 py-2 border-b border-slate-100"
            >
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" /> Saved Wishlist
              </span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/shipping-policy"
              className="flex items-center justify-between text-xs text-slate-700 hover:text-emerald-600 py-2 border-b border-slate-100"
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500" /> Delivery Standards
              </span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-between text-xs text-slate-700 hover:text-emerald-600 py-2"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" /> Customer Support
              </span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
