"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  AlertCircle,
  Tag,
} from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import Image from "next/image";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { calculatedCart, items, clearCart, couponCode, applyCoupon, removeCoupon } = useCart();

  // Form State
  const [email, setEmail] = useState("jane.doe@example.com");
  const [phone, setPhone] = useState("+1 (555) 234-5678");
  const [firstName, setFirstName] = useState("Jane");
  const [lastName, setLastName] = useState("Doe");
  const [address1, setAddress1] = useState("740 Park Avenue, Apt 14B");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("New York");
  const [state, setState] = useState("NY");
  const [postalCode, setPostalCode] = useState("10021");
  const [country, setCountry] = useState("US");

  // Options
  const [selectedShippingId, setSelectedShippingId] = useState("zone-us");
  const [paymentProvider, setPaymentProvider] = useState<"razorpay" | "mock">("razorpay");
  const [customerNotes, setCustomerNotes] = useState("");

  // Processing States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!calculatedCart || calculatedCart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState
          title="No Items to Checkout"
          description="Your bag is empty. Please add items to proceed with your order."
          actionText="Browse Catalog"
          actionHref="/products"
        />
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // 1. Submit order payload to server
      const checkoutPayload = {
        guestEmail: email,
        guestPhone: phone,
        shippingAddress: {
          first_name: firstName,
          last_name: lastName,
          address_1: address1,
          address_2: address2 || undefined,
          city,
          state,
          postal_code: postalCode,
          country,
          phone,
          type: "shipping" as const,
        },
        billingAddress: {
          first_name: firstName,
          last_name: lastName,
          address_1: address1,
          address_2: address2 || undefined,
          city,
          state,
          postal_code: postalCode,
          country,
          phone,
          type: "billing" as const,
        },
        shippingMethodId: selectedShippingId,
        couponCode: couponCode || undefined,
        paymentProvider,
        customerNotes,
        cartItems: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          quantity: i.quantity,
        })),
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || "Order placement failed");
      }

      const { order, paymentInitializationData } = data.data;

      // 2. Handle Razorpay Gateway Popup
      if (paymentProvider === "razorpay" && window.Razorpay) {
        const rzpOptions = {
          ...paymentInitializationData.clientPayload,
          handler: async function (response: any) {
            // Verify HMAC signature on server
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                providerOrderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              router.push(`/checkout/success/${order.order_number}`);
            } else {
              setErrorMessage("Payment signature verification failed. Please contact concierge.");
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
            },
          },
        };

        const rzp = new window.Razorpay(rzpOptions);
        rzp.open();
      } else {
        // Mock / Sandbox direct completion
        clearCart();
        router.push(`/checkout/success/${order.order_number}`);
      }
    } catch (err: any) {
      console.error("[Checkout Error]", err);
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Secure Checkout
        </h1>
        <Link
          href="/cart"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Bag
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-brand bg-rose-50 p-4 text-xs font-medium text-rose-800 border border-rose-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Contact, Address, Shipping, and Payment Inputs */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Customer Information */}
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs">
                1
              </span>
              Customer & Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Email Address (for order receipt)"
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Mobile Phone Number"
                type="tel"
                name="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs">
                2
              </span>
              Shipping Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="First Name"
                name="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                name="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <Input
              label="Street Address"
              name="address1"
              required
              placeholder="e.g. 740 Park Avenue"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
            />

            <Input
              label="Apartment, Suite, Unit (Optional)"
              name="address2"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label="State / Province"
                name="state"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <Input
                label="Postal / ZIP Code"
                name="postalCode"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Shipping Method */}
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs">
                3
              </span>
              Shipping Method
            </h2>

            <div className="space-y-3 pt-2">
              {[
                {
                  id: "zone-us",
                  name: "Standard Tracked Delivery (2-4 Business Days)",
                  rate: 15,
                  free_threshold: 200,
                },
                {
                  id: "zone-us-expedited",
                  name: "Overnight Express Air (Next Day)",
                  rate: 35,
                },
              ].map((zone) => {
                const isFree =
                  zone.free_threshold && calculatedCart.subtotal >= zone.free_threshold;
                const cost = isFree ? 0 : zone.rate;

                return (
                  <label
                    key={zone.id}
                    className={`flex items-center justify-between p-4 rounded-brand border cursor-pointer transition-all ${
                      selectedShippingId === zone.id
                        ? "border-brand-primary bg-slate-50/60 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={zone.id}
                        checked={selectedShippingId === zone.id}
                        onChange={() => setSelectedShippingId(zone.id)}
                        className="text-brand-primary focus:ring-brand-primary"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{zone.name}</p>
                        <p className="text-xs text-slate-500">Fully insured & carbon-neutral</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {cost === 0 ? "FREE" : `$${cost.toFixed(2)}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Payment Method */}
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs">
                4
              </span>
              Payment Gateway
            </h2>

            <div className="space-y-3 pt-2">
              <label
                className={`flex items-center justify-between p-4 rounded-brand border cursor-pointer transition-all ${
                  paymentProvider === "razorpay"
                    ? "border-brand-primary bg-slate-50/60 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="razorpay"
                    checked={paymentProvider === "razorpay"}
                    onChange={() => setPaymentProvider("razorpay")}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-600" /> Razorpay (Cards, UPI, NetBanking, Wallets)
                    </p>
                    <p className="text-xs text-slate-500">Secure server-side order with HMAC verification</p>
                  </div>
                </div>
                <span className="text-xs uppercase font-bold text-emerald-600">Active</span>
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-brand border cursor-pointer transition-all ${
                  paymentProvider === "mock"
                    ? "border-brand-primary bg-slate-50/60 shadow-2xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="mock"
                    checked={paymentProvider === "mock"}
                    onChange={() => setPaymentProvider("mock")}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      🧪 Sandbox / Direct Test Mode
                    </p>
                    <p className="text-xs text-slate-500">Instant test placement without live payment card</p>
                  </div>
                </div>
                <span className="text-xs uppercase font-bold text-slate-400">Sandbox</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Breakdown & Complete Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-6 sticky top-28">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
              Bag Summary ({calculatedCart.items.length} items)
            </h3>

            {/* Line items mini-list */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100">
              {calculatedCart.items.map((item) => (
                <div key={`${item.productId}_${item.variantId || "default"}`} className="pt-3 flex gap-3 items-center">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-brand bg-slate-100">
                    {item.image && <Image fill sizes="(max-width: 768px) 100vw, 33vw" src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Math Breakdown */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">${calculatedCart.subtotal.toFixed(2)}</span>
              </div>

              {calculatedCart.discount.amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold text-xs">
                  <span>Discount ({calculatedCart.discount.code})</span>
                  <span>-${calculatedCart.discount.amount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900">
                  {calculatedCart.shipping.amount === 0 ? "FREE" : `$${calculatedCart.shipping.amount.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Tax ({calculatedCart.tax.rate}%)</span>
                <span className="font-semibold text-slate-900">${calculatedCart.tax.amount.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-bold text-slate-900">
                <span>Total Due</span>
                <span className="text-2xl">${calculatedCart.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit CTA */}
            <Button
              type="submit"
              size="lg"
              variant="accent"
              isLoading={isSubmitting}
              className="w-full py-4 text-sm font-bold uppercase tracking-wider shadow-md gap-2"
            >
              <Lock className="h-4 w-4" /> Place Order & Pay ${calculatedCart.total.toFixed(2)}
            </Button>

            <div className="text-center text-[11px] text-slate-400 space-y-1">
              <p>By placing this order, you agree to our Terms of Sale and Privacy Policy.</p>
              <p className="flex items-center justify-center gap-1 text-slate-500 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Guaranteed Safe & Secure Checkout
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
