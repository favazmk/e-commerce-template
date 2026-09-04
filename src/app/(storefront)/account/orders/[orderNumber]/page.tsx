import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPin, Receipt, Truck } from "lucide-react";
import { OrderService } from "@/services/order.service";
import { getSessionUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/config/store.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/storefront/ProductImage";
import { OrderTimeline } from "@/components/storefront/OrderTimeline";
import { orderStatusLabel, orderStatusTone } from "@/lib/orders/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function AccountOrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;

  // getOrderForViewer enforces ownership: knowing an order number is not
  // enough to read an order that belongs to an account.
  const viewer = await getSessionUser();
  const order = await OrderService.getOrderForViewer(orderNumber, viewer);

  if (!order) notFound();

  const address = order.shipping_address;

  return (
    <div className="space-y-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted-ink hover:text-brand-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-faint-ink">
            Order
          </span>
          <h1 className="font-heading text-xl font-bold text-brand-ink">#{order.order_number}</h1>
          <p className="mt-1 text-xs text-brand-muted-ink">
            Placed{" "}
            {new Date(order.created_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <Badge variant={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
          <p className="mt-2 font-heading text-xl font-bold text-brand-ink">
            {formatPrice(order.total_amount, order.currency)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Tracking */}
        <section className="rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6 lg:col-span-5">
          <h2 className="mb-5 flex items-center gap-2 font-heading text-base font-bold text-brand-ink">
            <Truck className="h-4 w-4 text-brand-primary" /> Tracking
          </h2>
          <OrderTimeline order={order} />
        </section>

        {/* Items + totals */}
        <section className="space-y-6 lg:col-span-7">
          <div className="overflow-hidden rounded-brand-xl border border-brand-border bg-white shadow-subtle">
            <h2 className="border-b border-brand-border px-5 py-4 font-heading text-base font-bold text-brand-ink">
              Items in this order
            </h2>
            <ul className="divide-y divide-brand-border">
              {order.items?.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-brand border border-brand-border bg-brand-subtle">
                    <ProductImage
                      src={item.image_snapshot}
                      seed={item.product_name_snapshot}
                      alt=""
                      sizes="64px"
                      compact
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-brand-ink">
                      {item.product_name_snapshot}
                    </h3>
                    <p className="text-[11px] text-brand-faint-ink">SKU {item.sku_snapshot}</p>
                    {item.attributes_snapshot &&
                      Object.keys(item.attributes_snapshot).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(item.attributes_snapshot).map(([key, value]) => (
                            <span
                              key={key}
                              className="rounded-sm bg-brand-subtle px-1.5 py-0.5 text-[10px] font-medium text-brand-muted-ink"
                            >
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                    <p className="mt-1 text-xs text-brand-muted-ink">
                      Qty {item.quantity} × {formatPrice(item.price_snapshot, order.currency)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand-ink">
                    {formatPrice(item.total_price, order.currency)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Totals reproduce the frozen snapshot stored with the order, not a
                fresh calculation — prices may have changed since. */}
            <dl className="space-y-2 border-t border-brand-border bg-brand-subtle/60 px-5 py-4 text-sm">
              <div className="flex justify-between text-brand-muted-ink">
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal, order.currency)}</dd>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between font-semibold text-brand-primary">
                  <dt>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</dt>
                  <dd>-{formatPrice(order.discount_amount, order.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between text-brand-muted-ink">
                <dt>Shipping</dt>
                <dd>
                  {order.shipping_amount === 0
                    ? "Free"
                    : formatPrice(order.shipping_amount, order.currency)}
                </dd>
              </div>
              <div className="flex justify-between text-brand-muted-ink">
                <dt>Tax</dt>
                <dd>{formatPrice(order.tax_amount, order.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-brand-border pt-2 text-base font-bold text-brand-ink">
                <dt>Total paid</dt>
                <dd>{formatPrice(order.total_amount, order.currency)}</dd>
              </div>
            </dl>
          </div>

          {/* Delivery address */}
          <div className="rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-brand-ink">
              <MapPin className="h-4 w-4 text-brand-primary" /> Delivery address
            </h2>
            <address className="space-y-0.5 text-xs not-italic leading-relaxed text-brand-muted-ink">
              <p className="font-semibold text-brand-ink">
                {address.first_name} {address.last_name}
              </p>
              <p>{address.address_1}</p>
              {address.address_2 && <p>{address.address_2}</p>}
              <p>
                {address.city}
                {address.state ? `, ${address.state}` : ""} {address.postal_code}
              </p>
              <p>{address.country}</p>
              <p className="pt-1">{address.phone}</p>
            </address>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/checkout/success/${order.order_number}`}>
              <Button variant="outline" size="sm">
                <Receipt className="h-4 w-4" /> View printable receipt
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm">
                Need help with this order?
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
