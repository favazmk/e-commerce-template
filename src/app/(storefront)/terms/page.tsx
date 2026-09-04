import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getStoreDisplayName } from "@/lib/config/store.config";
import { canonicalUrl } from "@/lib/seo/site";
import { LegalPage, LegalSection } from "@/components/storefront/LegalPage";

/**
 * Terms of service.
 *
 * Template text — see the note in components/storefront/LegalPage. Governing
 * law and the consumer-rights section in particular must be set to the market
 * the client actually sells into.
 */

const LAST_UPDATED = "2026-01-01";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `The terms that apply when you buy from ${getStoreDisplayName()}.`,
  alternates: { canonical: canonicalUrl("/terms") },
};

export default function TermsOfServicePage() {
  const storeName = getStoreDisplayName();
  const governingLaw = process.env.NEXT_PUBLIC_GOVERNING_LAW?.trim();

  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated={LAST_UPDATED}
      intro={`These terms apply whenever you browse or buy from ${storeName}. By placing an order you agree to them, so please read them.`}
    >
      <LegalSection id="orders" title="1. Orders and acceptance">
        <p>
          Adding an item to your bag and paying is an <em>offer</em> to buy. A contract is formed
          only when we confirm dispatch. Until then we may decline an order — for example if the
          item has sold out, if a price was displayed incorrectly, or if we cannot verify the
          payment or the delivery address. If we decline an order after you have paid, we refund
          you in full.
        </p>
        <p>
          You are responsible for the accuracy of the delivery address and contact details you
          give us. We cannot recover a parcel sent to an address you entered incorrectly.
        </p>
      </LegalSection>

      <LegalSection id="pricing" title="2. Prices and payment">
        <p>
          Prices are shown in the currency displayed on the site and are confirmed at checkout
          before you pay. Taxes and delivery charges are shown separately in your order summary
          unless stated as included.
        </p>
        <p>
          Every price, discount, tax and delivery charge is recalculated on our servers at the
          moment you place the order. If the amount shown in your browser differs from the amount
          we calculate — because a price changed, a promotion expired, or your page was stale —
          the server figure applies and you will see it before payment is taken.
        </p>
        <p>
          Obvious pricing errors (for example a decimal point in the wrong place) do not bind us.
          If one occurs we will contact you and either cancel and refund the order, or confirm it
          at the correct price if you agree.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="3. Availability">
        <p>
          Stock levels shown on the site are updated continuously but items can sell out between
          your adding them to the bag and paying. If we cannot fulfil part of an order we will tell
          you and refund the affected items.
        </p>
      </LegalSection>

      <LegalSection id="delivery" title="4. Delivery">
        <p>
          Delivery estimates are estimates, not guarantees, and depend on the courier. Risk in the
          goods passes to you on delivery. Full details are in our{" "}
          <Link href="/shipping-policy" className="font-semibold text-brand-primary hover:underline">
            shipping policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="returns" title="5. Returns and cancellation">
        <p>
          Your rights to return an item and get a refund are set out in our{" "}
          <Link href="/refund-policy" className="font-semibold text-brand-primary hover:underline">
            returns and refunds policy
          </Link>
          , which forms part of these terms. Nothing in these terms limits any statutory right you
          have as a consumer.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="6. Your account">
        <p>
          You are responsible for keeping your password confidential and for activity carried out
          under your account. Tell us immediately if you believe someone else has access to it. You
          can sign out of every device from{" "}
          <Link href="/account/security" className="font-semibold text-brand-primary hover:underline">
            Login &amp; security
          </Link>
          .
        </p>
        <p>
          We may suspend or close an account that is used fraudulently, to abuse promotions, or in
          breach of these terms.
        </p>
      </LegalSection>

      <LegalSection id="promotions" title="7. Promotions and discount codes">
        <p>
          Discount codes are subject to their own conditions — minimum spend, expiry date, product
          eligibility and usage limits — which are applied automatically at checkout. Unless stated
          otherwise, codes cannot be combined, have no cash value, and may be withdrawn at any time.
          We may cancel orders and void codes where a promotion has been abused.
        </p>
      </LegalSection>

      <LegalSection id="reviews" title="8. Reviews and submitted content">
        <p>
          Reviews you submit are moderated before publication. Do not post content that is
          unlawful, misleading, offensive, or that infringes someone else&apos;s rights. We may
          remove any review at our discretion. By posting, you grant us a non-exclusive right to
          display and reproduce your review in connection with the product.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="9. Intellectual property">
        <p>
          All content on this site — text, product imagery, logos, layout and code — belongs to{" "}
          {storeName} or its licensors and is protected by intellectual property law. You may view
          and print it for your personal use in connection with shopping here. You may not copy,
          republish or use it commercially without written permission.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="10. Our liability">
        <p>
          We do not exclude or limit liability for death or personal injury caused by our
          negligence, for fraud, or for anything else that cannot lawfully be limited. Subject to
          that, our total liability in connection with an order is limited to the amount you paid
          for it, and we are not liable for indirect or consequential loss.
        </p>
      </LegalSection>

      <LegalSection id="law" title="11. Governing law">
        <p>
          {governingLaw
            ? `These terms are governed by the laws of ${governingLaw}, and disputes are subject to the exclusive jurisdiction of its courts.`
            : "These terms are governed by the laws of the jurisdiction in which this store is established, and disputes are subject to the exclusive jurisdiction of its courts."}{" "}
          If you are a consumer, this does not deprive you of the protection of the mandatory
          consumer law of the country where you live.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes to these terms">
        <p>
          We may update these terms. The version in force when you place an order is the version
          that applies to it.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
