import React from "react";
import Link from "next/link";
import { getStoreContact } from "@/lib/seo/site";
import { getStoreDisplayName } from "@/lib/config/store.config";

/**
 * Shared frame for policy pages.
 *
 * IMPORTANT, for whoever deploys a store from this template: the policy text in
 * these pages is a **starting point written to be broadly reasonable**, not
 * legal advice, and not a substitute for review by a lawyer in the market you
 * sell into. Consumer law differs materially by jurisdiction — the UAE requires
 * particular refund disclosures, the EU mandates a 14-day withdrawal right,
 * India and Saudi Arabia each have their own rules. Have a qualified adviser
 * check these before taking real money.
 *
 * Payment providers also check them: Razorpay, Stripe and PayPal all verify
 * that a live merchant publishes reachable refund, shipping, privacy and terms
 * pages with real contact details before approving an account.
 */

export interface LegalPageProps {
  title: string;
  /** ISO date the policy was last revised. */
  lastUpdated: string;
  /** Short summary shown above the fold. */
  intro: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, intro, children }: LegalPageProps) {
  const contact = getStoreContact();
  const storeName = getStoreDisplayName();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="border-b border-brand-border pb-6">
        <h1 className="font-heading text-3xl font-bold text-brand-ink">{title}</h1>
        <p className="mt-2 text-xs text-brand-faint-ink">
          Last updated:{" "}
          {new Date(lastUpdated).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-brand-muted-ink">{intro}</p>
      </header>

      <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-brand-muted-ink">
        {children}
      </div>

      <footer className="mt-12 rounded-brand-xl border border-brand-border bg-brand-subtle p-5">
        <h2 className="text-sm font-bold text-brand-ink">Questions about this policy?</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-brand-muted-ink">
          Contact {storeName}
          {contact.email && (
            <>
              {" at "}
              <a href={`mailto:${contact.email}`} className="font-semibold text-brand-primary hover:underline">
                {contact.email}
              </a>
            </>
          )}
          {contact.phone && (
            <>
              {" or call "}
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="font-semibold text-brand-primary hover:underline">
                {contact.phone}
              </a>
            </>
          )}
          {!contact.email && !contact.phone && (
            <>
              {" through our "}
              <Link href="/contact" className="font-semibold text-brand-primary hover:underline">
                contact page
              </Link>
            </>
          )}
          .
        </p>
        {(contact.streetAddress || contact.addressLocality) && (
          <address className="mt-3 text-xs not-italic leading-relaxed text-brand-muted-ink">
            {contact.streetAddress && (
              <>
                {contact.streetAddress}
                <br />
              </>
            )}
            {[contact.addressLocality, contact.addressRegion, contact.postalCode]
              .filter(Boolean)
              .join(", ")}
            {contact.addressCountry && (
              <>
                <br />
                {contact.addressCountry}
              </>
            )}
          </address>
        )}
      </footer>
    </div>
  );
}

/** Section heading with a stable anchor, so a policy clause can be linked to. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mt-8 font-heading text-lg font-bold text-brand-ink">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
