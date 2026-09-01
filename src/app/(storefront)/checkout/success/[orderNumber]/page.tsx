import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, Truck, ArrowRight, Printer, ShieldCheck } from "lucide-react";
import { OrderService } from "@/services/order.service";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export interface OrderSuccessPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderNumber } = await params;
  const order = await OrderService.getOrderById(orderNumber);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* Top Success Banner */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2 shadow-xs">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-600 block">
          Order Successfully Confirmed
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">
          Thank you for your order
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          We have dispatched a receipt to <span className="font-semibold text-slate-900">{order.guest_email || "your email"}</span>.
          Your artisanal garments are being prepared for dispatch.
        </p>
      </div>

      {/* Main Order Card */}
      <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
        {/* Card Header with Order Number and Date */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Order Number</span>
            <p className="text-lg font-bold text-slate-900 font-heading">#{order.order_number}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Order Date</span>
            <p className="text-sm font-medium text-slate-800">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Payment Status</span>
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
              {order.payment_status}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6 divide-y divide-slate-100">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-4">
            Purchased Items ({order.items?.length || 0})
          </h3>
          {order.items?.map((item) => (
            <div key={item.id} className="py-4 flex gap-4 items-center">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-brand bg-slate-100 border border-slate-100">
                {item.image_snapshot ? (
                  <Image fill sizes="(max-width: 768px) 100vw, 33vw" src={item.image_snapshot} alt={item.product_name_snapshot} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-slate-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900">{item.product_name_snapshot}</h4>
                <p className="text-xs text-slate-500">SKU: {item.sku_snapshot} • Qty: {item.quantity}</p>
                {item.attributes_snapshot && (
                  <p className="text-[11px] text-slate-400">
                    {Object.entries(item.attributes_snapshot).map(([k, v]) => `${k}: ${v}`).join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">
                  ${item.total_price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary & Delivery Address */}
        <div className="border-t border-slate-200 p-6 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shipping Address */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Delivery Destination
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
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
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount</span>
                <span>-${order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping ({order.shipping_method?.title || "Courier"})</span>
              <span className="font-semibold text-slate-900">
                {order.shipping_amount === 0 ? "FREE" : `$${order.shipping_amount.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span className="font-semibold text-slate-900">${order.tax_amount.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-slate-900">
              <span>Total Paid</span>
              <span>${order.total_amount.toFixed(2)}</span>
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
