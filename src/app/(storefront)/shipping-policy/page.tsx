import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getStoreDisplayName, formatPrice } from "@/lib/config/store.config";
import { canonicalUrl } from "@/lib/seo/site";
import { ShippingService } from "@/services/shipping.service";
import { SettingsService } from "@/services/settings.service";
import { LegalPage, LegalSection } from "@/components/storefront/LegalPage";

/**
 * Shipping policy.
 *
 * The rate table is rendered from the merchant's configured shipping methods
 * rather than written into the copy. That matters commercially as much as
 * legally: a policy page quoting rates the checkout no longer charges is a
 * chargeback argument the merchant loses.
 */

const LAST_UPDATED = "2026-01-01";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: `Delivery options, charges and timescales for ${getStoreDisplayName()}.`,
  alternates: { canonical: canonicalUrl("/shipping-policy") },
};

export default async function ShippingPolicyPage() {
  const [methods, general] = await Promise.all([
    ShippingService.getShippingMethods(),
    SettingsService.getSettingCategory("general"),
  ]);

  const cutoffHour = Number(general.dispatch_cutoff_hour);
  const handlingDays = Number(general.handling_days) || 1;

  return (
    <LegalPage
      title="Shipping & Delivery"
      lastUpdated={LAST_UPDATED}
      intro="What it costs, how long it takes, and what happens if something goes wrong on the way to you."
    >
      <LegalSection id="options" title="1. Delivery options and charges">
        {methods.length === 0 ? (
          <p>Delivery options are shown at checkout once you enter your address.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-brand-border text-left text-xs">
              <thead className="bg-brand-subtle font-bold uppercase text-brand-muted-ink">
                <tr>
                  <th className="border-b p-3">Option</th>
                  <th className="border-b p-3">Estimated transit</th>
                  <th className="border-b p-3">Charge</th>
                  <th className="border-b p-3">Free over</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {methods.map((method) => (
                  <tr key={method.id}>
                    <td className="p-3 font-semibold text-brand-ink">{method.name}</td>
                    <td className="p-3">{method.estimated_days || "Shown at checkout"}</td>
                    <td className="p-3">
                      {Number(method.rate) === 0 ? "Free" : formatPrice(Number(method.rate))}
                    </td>
                    <td className="p-3">
                      {method.free_threshold
                        ? formatPrice(Number(method.free_threshold))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-brand-muted-ink">
          The exact charge for your order is calculated at checkout, before you pay.
        </p>
      </LegalSection>

      <LegalSection id="processing" title="2. Order processing">
        <p>
          Orders are picked and packed within{" "}
          <strong>
            {handlingDays} working day{handlingDays === 1 ? "" : "s"}
          </strong>{" "}
          of payment clearing.
          {Number.isFinite(cutoffHour) && cutoffHour > 0
            ? ` Orders placed after ${cutoffHour}:00 are processed the next working day.`
            : ""}{" "}
          Transit time is counted from dispatch, not from when you order.
        </p>
        <p>
          We do not dispatch on weekends or public holidays. During sale periods, processing can
          take slightly longer — we will keep you updated by email.
        </p>
      </LegalSection>

      <LegalSection id="tracking" title="3. Tracking your order">
        <p>
          You receive an email when your order is confirmed and again when it ships. You can check
          the status at any time from{" "}
          <Link href="/account/orders" className="font-semibold text-brand-primary hover:underline">
            your orders
          </Link>
          , or — if you checked out as a guest — on the{" "}
          <Link href="/track-order" className="font-semibold text-brand-primary hover:underline">
            order tracking page
          </Link>{" "}
          using your order number and email address.
        </p>
      </LegalSection>

      <LegalSection id="addresses" title="4. Delivery addresses">
        <p>
          Please check your address carefully before paying. Once an order is with the courier we
          usually cannot change the destination. Parcels returned to us because the address was
          wrong or nobody was available to receive them can be re-sent, but a further delivery
          charge may apply.
        </p>
      </LegalSection>

      <LegalSection id="delays" title="5. Delays">
        <p>
          Delivery estimates are estimates. Weather, customs inspections and courier backlogs can
          all add time and are outside our control. If your order is significantly late, contact us
          with your order number and we will chase the courier and, where the parcel is lost,
          replace or refund it.
        </p>
      </LegalSection>

      <LegalSection id="damage" title="6. Damage in transit">
        <p>
          Check your parcel on arrival. If it looks damaged, photograph it before opening if you can
          and tell us within a reasonable time of delivery. We will arrange a replacement or a full
          refund — see the{" "}
          <Link href="/refund-policy" className="font-semibold text-brand-primary hover:underline">
            returns policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="customs" title="7. International orders, duties and taxes">
        <p>
          Where we ship outside our home market, import duties and local taxes may be charged on
          arrival by your country&apos;s customs authority. These are set by your government, are
          not included in the price you paid us, and are the responsibility of the recipient. We
          cannot predict them or refund them, and we do not under-declare the value of shipments.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
