import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getStoreDisplayName } from "@/lib/config/store.config";
import { canonicalUrl } from "@/lib/seo/site";
import { SettingsService } from "@/services/settings.service";
import { LegalPage, LegalSection } from "@/components/storefront/LegalPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqJsonLd } from "@/lib/seo/structured-data";

/**
 * Returns and refunds.
 *
 * Template text — see the note in components/storefront/LegalPage. The return
 * window is read from store settings rather than written into the copy, so the
 * page can never promise a window the merchant has not configured.
 */

const LAST_UPDATED = "2026-01-01";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: `How to return an item to ${getStoreDisplayName()} and how refunds are processed.`,
  alternates: { canonical: canonicalUrl("/refund-policy") },
};

export default async function RefundPolicyPage() {
  const storeName = getStoreDisplayName();
  const general = await SettingsService.getSettingCategory("general");

  const windowDays = Number(general.return_window_days) || 14;
  const refundDays = Number(general.refund_processing_days) || 7;
  const returnShippingPaidBy =
    general.return_shipping_paid_by === "merchant" ? "merchant" : "customer";

  const faqs = [
    {
      question: `How long do I have to return an item to ${storeName}?`,
      answer: `You have ${windowDays} days from the day your order is delivered to request a return.`,
    },
    {
      question: "How long does a refund take?",
      answer: `Once we receive and check the returned item, we issue the refund within ${refundDays} business days to your original payment method. Your bank may take a few days more to show it.`,
    },
    {
      question: "Who pays for return shipping?",
      answer:
        returnShippingPaidBy === "merchant"
          ? "We cover return shipping. We will send you a prepaid label."
          : "Return shipping is paid by the customer, unless the item arrived damaged, faulty or incorrect — in which case we cover it.",
    },
  ];

  return (
    <>
      {/* FAQ markup gives these answers a chance of appearing directly in
          search results, which deflects support contacts before they happen. */}
      <JsonLd data={faqJsonLd(faqs)} />

      <LegalPage
        title="Returns & Refunds"
        lastUpdated={LAST_UPDATED}
        intro={`If something is not right, you have ${windowDays} days from delivery to send it back. Here is exactly how that works.`}
      >
        <LegalSection id="window" title={`1. Your ${windowDays}-day return window`}>
          <p>
            You can request a return within <strong>{windowDays} days</strong> of the date your
            order is delivered. Start the request from{" "}
            <Link href="/account/orders" className="font-semibold text-brand-primary hover:underline">
              your orders
            </Link>
            , or{" "}
            <Link href="/contact" className="font-semibold text-brand-primary hover:underline">
              contact us
            </Link>{" "}
            with your order number.
          </p>
          <p>
            This is in addition to — never instead of — any statutory cancellation or
            faulty-goods right you have under the consumer law that applies to you.
          </p>
        </LegalSection>

        <LegalSection id="condition" title="2. Condition of returned items">
          <p>To be accepted, a returned item must be:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>unused and in the same condition in which you received it;</li>
            <li>in its original packaging, with any tags or seals still attached; and</li>
            <li>accompanied by the order number so we can match it to your purchase.</li>
          </ul>
          <p>
            You may inspect and try an item as you would in a shop. If it comes back showing use
            beyond that, we may reduce the refund to reflect the loss in value.
          </p>
        </LegalSection>

        <LegalSection id="exclusions" title="3. Items that cannot be returned">
          <p>Some items cannot be returned once supplied, unless they are faulty:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>products made or personalised to your specification;</li>
            <li>sealed items that are not suitable for return for health or hygiene reasons, once the seal is broken;</li>
            <li>perishable goods; and</li>
            <li>digital items and gift cards once delivered or redeemed.</li>
          </ul>
          <p>
            Where an exclusion applies to a particular product, it is stated on that
            product&apos;s page before you buy.
          </p>
        </LegalSection>

        <LegalSection id="faulty" title="4. Damaged, faulty or incorrect items">
          <p>
            If an item arrives damaged, faulty, or is not what you ordered, tell us within a
            reasonable time of delivery and send a photograph if you can. We will arrange a
            replacement or a full refund including the original delivery charge, and we cover the
            cost of sending it back. This applies whether or not the {windowDays}-day window has
            passed.
          </p>
        </LegalSection>

        <LegalSection id="shipping-costs" title="5. Return shipping costs">
          <p>
            {returnShippingPaidBy === "merchant"
              ? "We cover return shipping on all approved returns and will provide a prepaid label."
              : "Return shipping is paid by you, unless the item was damaged, faulty or incorrect, in which case we cover it."}{" "}
            Please keep proof of postage — until the parcel reaches us, it is your responsibility.
          </p>
        </LegalSection>

        <LegalSection id="refunds" title="6. How refunds are issued">
          <p>
            Once we receive the item and confirm its condition, we issue the refund within{" "}
            <strong>{refundDays} business days</strong>. Refunds always go back to the original
            payment method — we cannot redirect a refund to a different card or account. Your bank
            or card issuer may take several further days to show it on your statement.
          </p>
          <p>
            Where the whole order is returned, the original standard delivery charge is refunded
            too. Any extra you paid for a faster delivery option is not refunded, since that service
            was provided.
          </p>
        </LegalSection>

        <LegalSection id="exchanges" title="7. Exchanges">
          <p>
            The fastest way to get a different size or colour is to return the original for a refund
            and place a new order — that way the replacement is not held up waiting for the return
            to arrive. Contact us if you would prefer us to arrange a direct exchange.
          </p>
        </LegalSection>

        <LegalSection id="cancelling" title="8. Cancelling before dispatch">
          <p>
            If your order has not yet shipped, contact us as quickly as you can and we will cancel
            it and refund you in full. Once it is with the courier it has to be returned in the
            normal way.
          </p>
        </LegalSection>
      </LegalPage>
    </>
  );
}
