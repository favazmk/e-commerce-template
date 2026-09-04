import React from "react";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import { canonicalUrl } from "@/lib/seo/site";
import { getStoreDisplayName } from "@/lib/config/store.config";
import { TrackOrderForm } from "./TrackOrderForm";

export const metadata: Metadata = {
  title: "Track your order",
  description: `Enter your order number and email to see exactly where your ${getStoreDisplayName()} order is.`,
  alternates: { canonical: canonicalUrl("/track-order") },
};

/**
 * Public order tracking.
 *
 * Guests have no account to log into, so without this page every "where is my
 * order?" becomes a support ticket. Two factors — order number and the email
 * the order was placed with — keep it from being an enumeration surface.
 */
export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-success/10 text-brand-primary">
          <Package className="h-7 w-7" />
        </span>
        <h1 className="font-heading text-2xl font-bold text-brand-ink sm:text-3xl">
          Track your order
        </h1>
        <p className="mt-2 text-sm text-brand-muted-ink">
          No account needed — just your order number and the email you used.
        </p>
      </header>

      <TrackOrderForm />
    </div>
  );
}
