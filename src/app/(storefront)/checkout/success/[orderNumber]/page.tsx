import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, Truck, ArrowRight, Printer, ShieldCheck } from "lucide-react";
import { OrderService } from "@/services/order.service";
import { getSessionUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/storefront/ProductImage";
import { formatPrice } from "@/lib/config/store.config";
import { PurchaseTracker } from "@/components/storefront/PurchaseTracker";

export interface OrderSuccessPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderNumber } = await params;

  // A receipt carries the customer's address, email and phone. Knowing the
  // order number is only sufficient for guest orders; an order attached to an
  // account is released to its owner (or an admin) and nobody else.
  const viewer = await getSessionUser();
  const order = await OrderService.getOrderForViewer(orderNumber, viewer);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* Conversion reporting, driven by the stored order rather than by the
          cart the browser held a moment ago. */}
      <PurchaseTracker
        orderNumber={order.order_number}
        value={Number(order.total_amount)}
        currency={order.currency}
        tax={Number(order.tax_amount)}
        shipping={Number(order.shipping_amount)}
        coupon={order.coupon_code}
        items={(order.items || []).map((item) => ({
          item_id: item.product_id || item.sku_snapshot,
          item_name: item.product_name_snapshot,
          price: Number(item.price_snapshot),
          quantity: item.quantity,
        }))}
      />
      {/* Top Success Banner */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-success/15 text-brand-primary mb-2 shadow-sm">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <span className="text-xs uppercase font-bold tracking-widest text-brand-primary block">
          Order Successfully Confirmed
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-brand-ink">
          Thank you for your order
        </h1>
        {/* Generic by design: the MASTER template ships to every client, so
            product-category wording ("garments", "fragrances") belongs in the
            client repository, never here (AGENTS.md sections 9 and 25). */}
        <p className="text-sm text-brand-muted-ink max-w-md mx-auto">
          We have emailed your receipt to{" "}
          <span className="font-semibold text-brand-ink">{order.guest_email || "your email address"}</span>.
          Your order is being prepared and you will get tracking details as soon as it ships.
        </p>
      </div>

      {/* Main Order Card */}
      <div className="rounded-brand-xl border border-brand-border bg-white shadow-subtle overflow-hidden">
        {/* Card Header with Order Number and Date */}
        <div className="bg-brand-subtle border-b border-brand-border p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-brand-faint-ink uppercase font-semibold">Order Number</span>
            <p className="text-lg font-bold text-brand-ink font-heading">#{order.order_number}</p>
          </div>
          <div>
            <span className="text-xs text-brand-faint-ink uppercase font-semibold">Order Date</span>
            <p className="text-sm font-medium text-brand-ink">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <span className="text-xs text-brand-faint-ink uppercase font-semibold">Payment Status</span>
            <p className="text-sm font-bold text-brand-primary uppercase tracking-wider">
              {order.payment_status}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6 divide-y divide-brand-border">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-ink pb-4">
            Purchased Items ({order.items?.length || 0})
          </h3>
          {order.items?.map((item) => (
            <div key={item.id} className="py-4 flex gap-4 items-center">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-brand bg-brand-subtle border border-brand-border">
                {item.image_snapshot ? (
                  <ProductImage src={item.image_snapshot} seed={item.product_name_snapshot} alt="" sizes="64px" compact className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-brand-border" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-brand-ink">{item.product_name_snapshot}</h4>
                <p className="text-xs text-brand-muted-ink">SKU: {item.sku_snapshot} • Qty: {item.quantity}</p>
                {item.attributes_snapshot && (
                  <p className="text-[11px] text-brand-faint-ink">
                    {Object.entries(item.attributes_snapshot).map(([k, v]) => `${k}: ${v}`).join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-brand-ink">
                  {formatPrice(item.total_price, order.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary & Delivery Address */}
        <div className="border-t border-brand-border p-6 bg-brand-subtle/50 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shipping Address */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-ink mb-2">
              Delivery Destination
            </h4>
            <p className="text-xs text-brand-muted-ink leading-relaxed">
              {order.shipping_address.first_name} {order.shipping_address.last_name}
              <br />
              {order.shipping_address.address_1}
              {order.shipping_address.address_2 && `, ${order.shipping_address.address_2}`}
              <br />
              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
              <br />
              {order.shipping_address.country}
              <br />
              Phone: {order.shipping_address.phone}
            </p>
          </div>

          {/* Math breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-brand-muted-ink">
              <span>Subtotal</span>
              <span className="font-semibold text-brand-ink">{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-brand-primary font-semibold">
                <span>Coupon Discount</span>
                <span>-{formatPrice(order.discount_amount, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-brand-muted-ink">
              <span>Shipping ({order.shipping_method?.title || "Courier"})</span>
              <span className="font-semibold text-brand-ink">
                {order.shipping_amount === 0 ? "FREE" : formatPrice(order.shipping_amount, order.currency)}
              </span>
            </div>
            <div className="flex justify-between text-brand-muted-ink">
              <span>Tax</span>
              <span className="font-semibold text-brand-ink">{formatPrice(order.tax_amount, order.currency)}</span>
            </div>
            <div className="border-t border-brand-border pt-2 flex justify-between text-base font-bold text-brand-ink">
              <span>Total Paid</span>
              <span>{formatPrice(order.total_amount, order.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/products">
          <Button variant="primary" size="md" className="gap-2">
            Continue Shopping <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/account">
          <Button variant="outline" size="md">
            View Order in Account
          </Button>
        </Link>
      </div>
    </div>
  );
}
