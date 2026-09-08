"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ShieldCheck, CreditCard, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { useCart } from "@/features/cart/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/config/store.config";
import { useStoreFeatures } from "@/features/settings/StoreFeaturesContext";
import { ProductImage } from "@/components/storefront/ProductImage";
import { AnalyticsService } from "@/services/analytics.service";
import { FreeShippingBar } from "@/components/storefront/FreeShippingBar";
import {
  getCountryFormat,
  getDefaultCountry,
  getSupportedCountries,
} from "@/lib/config/regions";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Demo mode is a build-time, deployment-level switch. It must never be
// inferrable or selectable by a shopper (see AGENTS.md sections 5 and 6).
const DEMO_MODE = process.env.NEXT_PUBLIC_APP_MODE === "demo";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    calculatedCart,
    items,
    clearCart,
    couponCode,
    shippingMethodId,
    setShippingMethodId,
  } = useCart();

  // Form State — intentionally empty. Pre-filling real-looking names and
  // addresses ships someone else's details to production customers.
  const { guestCheckout } = useStoreFeatures();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  // Start on the store's home market rather than an empty box. Most orders are
  // domestic, so the default is right far more often than it is wrong.
  const [country, setCountry] = useState(() => getDefaultCountry().name);

  // Options
  const [paymentProvider, setPaymentProvider] = useState<"razorpay" | "mock">(
    DEMO_MODE ? "mock" : "razorpay"
  );
  const [customerNotes, setCustomerNotes] = useState("");

  // Processing States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGatewayReady, setIsGatewayReady] = useState(false);

  const shippingMethods = useMemo(
    () => calculatedCart?.availableShippingMethods ?? [],
    [calculatedCart]
  );
  const currency = calculatedCart?.currency;

  const supportedCountries = useMemo(() => getSupportedCountries(), []);
  // Drives the region label, the region list and whether a postal code is asked
  // for at all — see lib/config/regions.ts.
  const addressFormat = useMemo(() => getCountryFormat(country), [country]);

  // The cheapest method that offers free delivery decides the target the
  // shopper is working towards.
  const freeShippingThreshold = useMemo(() => {
    const thresholds = shippingMethods
      .map((method) => method.free_threshold)
      .filter((value): value is number => typeof value === "number" && value > 0)
      .sort((a, b) => a - b);
    return thresholds[0] ?? null;
  }, [shippingMethods]);

  // Default to the first server-configured method once the cart resolves.
  useEffect(() => {
    if (!shippingMethodId && shippingMethods.length > 0) {
      setShippingMethodId(shippingMethods[0].id);
    }
  }, [shippingMethodId, shippingMethods, setShippingMethodId]);

  // begin_checkout marks the top of the conversion funnel Google Ads optimises
  // against. Guarded with a ref because the cart recalculates whenever the
  // shipping method changes, which would otherwise fire it repeatedly.
  const beginCheckoutReported = useRef(false);
  useEffect(() => {
    if (beginCheckoutReported.current || !calculatedCart || calculatedCart.items.length === 0) {
      return;
    }
    beginCheckoutReported.current = true;
    AnalyticsService.track("begin_checkout", {
      currency: calculatedCart.currency,
      value: calculatedCart.total,
      coupon: calculatedCart.discount.code,
      items: calculatedCart.items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
    });
  }, [calculatedCart]);

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
      const address = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        address_1: address1.trim(),
        address_2: address2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country: country.trim(),
        phone: phone.trim(),
      };

      // 1. Submit order payload to server
      const checkoutPayload = {
        guestEmail: email.trim(),
        guestPhone: phone.trim(),
        shippingAddress: { ...address, type: "shipping" as const },
        billingAddress: { ...address, type: "billing" as const },
        shippingMethodId,
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

      // 2. Hand off to the gateway.
      if (paymentProvider === "razorpay") {
        if (!isGatewayReady || typeof window.Razorpay !== "function") {
          // Previously this fell through to the "order complete" branch, which
          // cleared the cart and showed a success page without taking payment.
          throw new Error(
            "The payment gateway could not be loaded. Please disable any content blocker and try again — your order has not been paid for."
          );
        }

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
              setErrorMessage(
                "Payment verification failed. If you were charged, please contact support with your order number."
              );
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
        return;
      }

      // Simulated gateway — only reachable when the deployment enables demo mode.
      clearCart();
      router.push(`/checkout/success/${order.order_number}`);
    } catch (err: any) {
      console.error("[Checkout Error]", err);
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Razorpay Gateway */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setIsGatewayReady(true)}
        onLoad={() => setIsGatewayReady(true)}
        onError={() => setIsGatewayReady(false)}
      />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-brand-ink">
          Secure Checkout
        </h1>
        <Link
          href="/cart"
          className="text-xs font-semibold text-brand-muted-ink hover:text-brand-ink flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Bag
        </Link>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-3 rounded-brand bg-brand-danger-surface p-4 text-xs font-medium text-brand-danger border border-brand-danger-border"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-brand-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Contact, Address, Shipping, and Payment Inputs */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Customer Information */}
          <div className="rounded-brand-xl border border-brand-border bg-white p-4 sm:p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-bold text-brand-ink flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-ink text-white text-xs">
                1
              </span>
              Customer &amp; Contact Information
            </h2>

            {/* When guest checkout is switched off, say so here rather than
                letting the customer fill in the whole form and be refused at
                the end. The server enforces the rule regardless. */}
            {!guestCheckout && (
              <p className="rounded-brand border border-brand-warning-border bg-brand-warning-surface p-3 text-xs font-semibold text-brand-warning">
                An account is required to place an order.{" "}
                <Link href="/login" className="underline">
                  Sign in or create one
                </Link>{" "}
                to continue.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Email Address (for order receipt)"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Mobile Phone Number"
                type="tel"
                name="phone"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="rounded-brand-xl border border-brand-border bg-white p-4 sm:p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-bold text-brand-ink flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-ink text-white text-xs">
                2
              </span>
              Shipping Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <Input
              label="Street Address"
              name="address1"
              autoComplete="address-line1"
              required
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
            />

            <Input
              label="Apartment, Suite, Unit (Optional)"
              name="address2"
              autoComplete="address-line2"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                autoComplete="address-level2"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              {/* Regions come from the selected country. "State / Province" is
                  meaningless in the UAE, where the divisions are emirates. */}
              {addressFormat.regions ? (
                <div className="w-full space-y-1.5 text-left">
                  <label
                    htmlFor="state"
                    className="block text-xs font-semibold uppercase tracking-wider text-brand-ink"
                  >
                    {addressFormat.regionLabel}
                  </label>
                  <select
                    id="state"
                    name="state"
                    autoComplete="address-level1"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="block w-full rounded-brand border border-brand-border-strong bg-white px-3.5 py-2.5 text-sm text-brand-ink focus:border-brand-ink focus:outline-none"
                  >
                    <option value="">Select {addressFormat.regionLabel.toLowerCase()}</option>
                    {addressFormat.regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input
                  label={addressFormat.regionLabel}
                  name="state"
                  autoComplete="address-level1"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              )}

              {/* The UAE has no postal code system. Requiring one either blocks
                  the order or teaches customers to type "00000", which then
                  reaches the courier on every label. */}
              {addressFormat.postalCode !== "none" && (
                <Input
                  label={addressFormat.postalCodeLabel}
                  name="postalCode"
                  autoComplete="postal-code"
                  required={addressFormat.postalCode === "required"}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              )}
            </div>

            <div className="w-full space-y-1.5 text-left">
              <label
                htmlFor="country"
                className="block text-xs font-semibold uppercase tracking-wider text-brand-ink"
              >
                Country
              </label>
              <select
                id="country"
                name="country"
                autoComplete="country-name"
                required
                value={country}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === country) return;

                  setCountry(next);
                  // The region list and postal-code rule change with the
                  // country, so a stale region must not survive the switch.
                  //
                  // Guarded on an actual change: a `change` event that reselects
                  // the same country would otherwise silently wipe the emirate
                  // the shopper had already chosen, leaving a required field
                  // empty and the form refusing to submit with no visible
                  // explanation.
                  setState("");
                  setPostalCode("");
                }}
                className="block w-full rounded-brand border border-brand-border-strong bg-white px-3.5 py-2.5 text-sm text-brand-ink focus:border-brand-ink focus:outline-none"
              >
                {supportedCountries.map((entry) => (
                  <option key={entry.code} value={entry.name}>
                    {entry.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-brand-muted-ink">
                Only countries we deliver to are listed.
              </p>
            </div>
          </div>

          {/* Section 3: Shipping Method */}
          <div className="rounded-brand-xl border border-brand-border bg-white p-4 sm:p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-bold text-brand-ink flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-ink text-white text-xs">
                3
              </span>
              Shipping Method
            </h2>

            <div className="space-y-3 pt-2">
              {shippingMethods.length === 0 && (
                <p className="text-xs text-brand-muted-ink">
                  Calculating available delivery options&hellip;
                </p>
              )}
              {shippingMethods.map((zone) => {
                const isFree =
                  Boolean(zone.free_threshold) &&
                  calculatedCart.subtotal >= (zone.free_threshold as number);
                const cost = isFree ? 0 : zone.rate;

                return (
                  <label
                    key={zone.id}
                    className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-brand border cursor-pointer transition-all ${
                      shippingMethodId === zone.id
                        ? "border-brand-primary bg-brand-subtle/60 shadow-sm"
                        : "border-brand-border hover:border-brand-border-strong"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={zone.id}
                        checked={shippingMethodId === zone.id}
                        onChange={() => setShippingMethodId(zone.id)}
                        className="text-brand-primary focus:ring-brand-primary flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-ink">{zone.name}</p>
                        {zone.estimated_days && (
                          <p className="text-xs text-brand-muted-ink">{zone.estimated_days}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-brand-ink">
                      {cost === 0 ? "FREE" : formatPrice(cost, currency)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Payment Method */}
          <div className="rounded-brand-xl border border-brand-border bg-white p-4 sm:p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-bold text-brand-ink flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-ink text-white text-xs">
                4
              </span>
              Payment
            </h2>

            <div className="space-y-3 pt-2">
              <label
                className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-brand border cursor-pointer transition-all ${
                  paymentProvider === "razorpay"
                    ? "border-brand-primary bg-brand-subtle/60 shadow-sm"
                    : "border-brand-border hover:border-brand-border-strong"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="razorpay"
                    checked={paymentProvider === "razorpay"}
                    onChange={() => setPaymentProvider("razorpay")}
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-ink flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-brand-primary flex-shrink-0" /> Card, UPI,
                      NetBanking &amp; Wallets
                    </p>
                    <p className="text-xs text-brand-muted-ink">
                      Processed by the gateway with server-side signature verification
                    </p>
                  </div>
                </div>
              </label>

              {/*
                The simulated gateway approves every payment. It is rendered only
                for demo deployments; the server rejects it otherwise.
              */}
              {DEMO_MODE && (
                <label
                  className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-brand border cursor-pointer transition-all ${
                    paymentProvider === "mock"
                      ? "border-brand-primary bg-brand-subtle/60 shadow-sm"
                      : "border-brand-border hover:border-brand-border-strong"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="paymentProvider"
                      value="mock"
                      checked={paymentProvider === "mock"}
                      onChange={() => setPaymentProvider("mock")}
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-ink">Simulated Gateway</p>
                      <p className="text-xs text-brand-muted-ink">
                        Demo deployments only &mdash; no payment is taken
                      </p>
                    </div>
                  </div>
                  <span className="text-xs uppercase font-bold text-brand-warning">Demo</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order Summary Breakdown & Complete Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-brand-xl border border-brand-border bg-white p-4 sm:p-6 shadow-subtle space-y-6 lg:sticky lg:top-28">
            <h3 className="text-lg font-bold text-brand-ink border-b border-brand-border pb-4">
              Bag Summary ({calculatedCart.items.length} items)
            </h3>

            {/*
              Free-delivery progress, repeated here rather than left on the cart.

              Checkout is where the delivery charge becomes real and where
              unexpected shipping cost is the single largest cause of
              abandonment. Telling a shopper they are AED 45 away from free
              delivery at the exact moment they see the charge turns a reason to
              leave into a reason to add one more item.

              The threshold comes from the server-calculated cart, so the bar and
              the amount actually charged can never disagree.
            */}
            <FreeShippingBar
              subtotal={calculatedCart.subtotal - calculatedCart.discount.amount}
              threshold={freeShippingThreshold}
              onKeepShopping="/products"
            />

            {/* Line items mini-list */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1 divide-y divide-brand-border">
              {calculatedCart.items.map((item) => (
                <div
                  key={`${item.productId}_${item.variantId || "default"}`}
                  className="pt-3 flex gap-3 items-center"
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-brand bg-brand-subtle">
                    <ProductImage src={item.image} seed={item.name} alt="" sizes="56px" compact className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-ink truncate">{item.name}</p>
                    <p className="text-[11px] text-brand-muted-ink">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-brand-ink">
                    {formatPrice(item.totalPrice, currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Math Breakdown */}
            <div className="border-t border-brand-border pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-brand-muted-ink">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-ink">
                  {formatPrice(calculatedCart.subtotal, currency)}
                </span>
              </div>

              {calculatedCart.discount.amount > 0 && (
                <div className="flex justify-between text-brand-primary font-semibold text-xs">
                  <span className="truncate">Discount ({calculatedCart.discount.code})</span>
                  <span>-{formatPrice(calculatedCart.discount.amount, currency)}</span>
                </div>
              )}

              <div className="flex justify-between text-brand-muted-ink">
                <span>Shipping</span>
                <span className="font-semibold text-brand-ink">
                  {calculatedCart.shipping.amount === 0
                    ? "FREE"
                    : formatPrice(calculatedCart.shipping.amount, currency)}
                </span>
              </div>

              <div className="flex justify-between text-brand-muted-ink">
                <span>
                  Tax ({calculatedCart.tax.rate}%
                  {calculatedCart.tax.isInclusive ? ", included" : ""})
                </span>
                <span className="font-semibold text-brand-ink">
                  {formatPrice(calculatedCart.tax.amount, currency)}
                </span>
              </div>

              <div className="border-t border-brand-border pt-3 flex flex-wrap items-baseline justify-between gap-2 text-base font-bold text-brand-ink">
                <span>Total Due</span>
                <span className="text-2xl">{formatPrice(calculatedCart.total, currency)}</span>
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
              <Lock className="h-4 w-4" /> Place Order &amp; Pay{" "}
              {formatPrice(calculatedCart.total, currency)}
            </Button>

            <div className="text-center text-[11px] text-brand-faint-ink space-y-1">
              <p>
                By placing this order, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-brand-muted-ink">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="underline hover:text-brand-muted-ink">
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="flex items-center justify-center gap-1 text-brand-muted-ink font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
                Secure checkout
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
