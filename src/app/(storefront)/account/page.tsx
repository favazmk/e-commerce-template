import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Package, ShoppingBag, Wallet } from "lucide-react";
import { OrderService } from "@/services/order.service";
import { AccountService } from "@/services/account.service";
import { getSessionUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/config/store.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/storefront/ProductImage";
import { orderStatusTone } from "@/lib/orders/status";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  // The layout already redirected an anonymous visitor; this resolves the user
  // again because a layout cannot pass data down to a page in the App Router.
  const user = await getSessionUser();
  if (!user) return null;

  const [orders, addresses] = await Promise.all([
    OrderService.getUserOrders(user.id),
    AccountService.getAddresses(user.id),
  ]);

  // Only settled orders count as money spent — a failed payment is not a purchase.
  const settled = orders.filter(
    (order) => !["cancelled", "failed", "pending", "payment_pending"].includes(order.status)
  );
  const lifetimeSpend = settled.reduce((total, order) => total + Number(order.total_amount), 0);
  const inFlight = orders.filter((order) =>
    ["paid", "confirmed", "processing", "packed", "shipped", "out_for_delivery"].includes(
      order.status
    )
  );

  const recentOrders = orders.slice(0, 3);
  const defaultAddress = addresses.find((address) => address.is_default) || addresses[0];

  const summary = [
    { label: "Orders placed", value: String(orders.length), icon: Package },
    { label: "On the way", value: String(inFlight.length), icon: ShoppingBag },
    { label: "Lifetime spend", value: formatPrice(lifetimeSpend), icon: Wallet },
    { label: "Saved addresses", value: String(addresses.length), icon: MapPin },
  ];

  return (
    <div className="space-y-8">
      {/* At-a-glance numbers */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-brand-xl border border-brand-border bg-white p-4 shadow-subtle sm:p-5"
          >
            <item.icon className="h-4 w-4 text-brand-primary" />
            <p className="mt-3 font-heading text-xl font-bold text-brand-ink sm:text-2xl">
              {item.value}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-brand-faint-ink">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* Live order tracking gets the top slot: it is the single most common
          reason a customer opens their account at all. */}
      {inFlight.length > 0 && (
        <section className="rounded-brand-xl border border-brand-success/30 bg-brand-success/10/60 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-heading text-base font-bold text-brand-ink">
            <Package className="h-4 w-4 text-brand-primary" /> On its way to you
          </h2>
          <ul className="mt-4 space-y-3">
            {inFlight.slice(0, 3).map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-brand border border-brand-success/30 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-bold text-brand-ink">#{order.order_number}</p>
                  <p className="text-xs text-brand-muted-ink">
                    {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? "" : "s"}
                    {order.shipping_method?.estimated_days
                      ? ` · Arrives in ${order.shipping_method.estimated_days}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={orderStatusTone(order.status)} size="sm">
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                  <Link
                    href={`/account/orders/${order.order_number}`}
                    className="text-xs font-bold text-brand-primary hover:underline"
                  >
                    Track
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent orders */}
      <section className="rounded-brand-xl border border-brand-border bg-white shadow-subtle">
        <div className="flex items-center justify-between border-b border-brand-border p-5 sm:p-6">
          <h2 className="font-heading text-base font-bold text-brand-ink">Recent orders</h2>
          {orders.length > 3 && (
            <Link
              href="/account/orders"
              className="flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto h-10 w-10 text-brand-faint-ink" />
            <h3 className="mt-3 text-sm font-semibold text-brand-ink">No orders yet</h3>
            <p className="mt-1 text-xs text-brand-muted-ink">
              Your orders will appear here as soon as you place one.
            </p>
            <Link href="/products" className="mt-4 inline-block">
              <Button size="sm">Start shopping</Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-brand-border">
            {recentOrders.map((order) => (
              <li key={order.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-ink">#{order.order_number}</p>
                    <p className="text-xs text-brand-muted-ink">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={orderStatusTone(order.status)} size="sm">
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-sm font-bold text-brand-ink">
                      {formatPrice(order.total_amount, order.currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {order.items?.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="relative h-12 w-12 overflow-hidden rounded-brand border border-brand-border bg-brand-subtle"
                      title={item.product_name_snapshot}
                    >
                      <ProductImage
                        src={item.image_snapshot}
                        seed={item.product_name_snapshot}
                        alt=""
                        sizes="48px"
                        compact
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {(order.items?.length || 0) > 5 && (
                    <span className="text-xs font-medium text-brand-faint-ink">
                      +{(order.items?.length || 0) - 5} more
                    </span>
                  )}
                  <Link
                    href={`/account/orders/${order.order_number}`}
                    className="ml-auto flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
                  >
                    Details <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Default address */}
      <section className="rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-base font-bold text-brand-ink">
            <MapPin className="h-4 w-4 text-brand-primary" /> Default delivery address
          </h2>
          <Link
            href="/account/addresses"
            className="text-xs font-bold text-brand-primary hover:underline"
          >
            Manage
          </Link>
        </div>

        {defaultAddress ? (
          <address className="mt-4 space-y-0.5 rounded-brand border border-brand-border bg-brand-subtle p-4 text-xs not-italic leading-relaxed text-brand-muted-ink">
            <p className="font-semibold text-brand-ink">
              {defaultAddress.first_name} {defaultAddress.last_name}
            </p>
            <p>{defaultAddress.address_1}</p>
            {defaultAddress.address_2 && <p>{defaultAddress.address_2}</p>}
            <p>
              {defaultAddress.city}
              {defaultAddress.state ? `, ${defaultAddress.state}` : ""} {defaultAddress.postal_code}
            </p>
            <p>{defaultAddress.country}</p>
            <p className="pt-1 text-brand-muted-ink">{defaultAddress.phone}</p>
          </address>
        ) : (
          <div className="mt-4 rounded-brand border border-dashed border-brand-border-strong bg-brand-subtle p-5 text-center">
            <p className="text-xs text-brand-muted-ink">
              No saved address yet. Saving one now makes every future checkout a single tap.
            </p>
            <Link href="/account/addresses" className="mt-3 inline-block">
              <Button size="sm" variant="outline">
                Add an address
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
