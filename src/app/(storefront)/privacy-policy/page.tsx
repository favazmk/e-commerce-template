import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getStoreDisplayName } from "@/lib/config/store.config";
import { getStoreContact, canonicalUrl } from "@/lib/seo/site";
import { LegalPage, LegalSection } from "@/components/storefront/LegalPage";

/**
 * Privacy policy.
 *
 * Template text — see the note in components/storefront/LegalPage. Have it
 * reviewed against the law of the market you sell into before going live.
 */

const LAST_UPDATED = "2026-01-01";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${getStoreDisplayName()} collects, uses and protects your personal information.`,
  alternates: { canonical: canonicalUrl("/privacy-policy") },
};

export default function PrivacyPolicyPage() {
  const storeName = getStoreDisplayName();
  const contact = getStoreContact();

  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={`This policy explains what personal information ${storeName} collects when you shop with us, why we collect it, who we share it with, and the choices you have.`}
    >
      <LegalSection id="what-we-collect" title="1. Information we collect">
        <p>We collect only what we need to sell to you and support you afterwards.</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Identity and contact details</strong> — your name, email address, phone number,
            and billing and delivery addresses. Provided by you at checkout or in your account.
          </li>
          <li>
            <strong>Order information</strong> — the items you bought, the amounts, the currency, and
            the payment reference returned by our payment provider.
          </li>
          <li>
            <strong>Account information</strong> — your saved addresses and order history, if you
            create an account. Your password is never visible to us; it is stored as a one-way hash
            by our authentication provider.
          </li>
          <li>
            <strong>Technical information</strong> — IP address, browser and device type, and the
            pages you visit. Used for security, fraud prevention and to keep the site working.
          </li>
          <li>
            <strong>Communications</strong> — messages you send us, and whether you opened our
            emails, if you subscribed to them.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="payment-data" title="2. Payment information">
        <p>
          <strong>We never see or store your full card number.</strong> Card details are entered
          directly into our payment provider&apos;s own hosted form and are processed on their
          PCI-DSS certified infrastructure. We receive only a transaction reference, the amount, and
          whether the payment succeeded — enough to fulfil your order and issue a refund, and
          nothing that could be used to charge your card again.
        </p>
        <p>
          Every payment confirmation we receive is cryptographically verified before an order is
          marked as paid.
        </p>
      </LegalSection>

      <LegalSection id="why" title="3. Why we use your information">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To take payment for, prepare and deliver your order, and to handle returns.</li>
          <li>To send transactional messages — order confirmation, dispatch and delivery updates.</li>
          <li>To provide customer support and answer your questions.</li>
          <li>To detect and prevent fraud, abuse and security incidents.</li>
          <li>To meet our tax, accounting and other legal obligations.</li>
          <li>
            With your consent, to send marketing emails and to measure how our advertising performs.
            You can withdraw that consent at any time.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies" title="4. Cookies and tracking">
        <p>
          <strong>Strictly necessary cookies</strong> keep your shopping bag and your sign-in
          session working. They cannot be switched off, because the store would not function
          without them.
        </p>
        <p>
          <strong>Analytics and advertising cookies</strong> are only set after you agree. Until you
          make a choice, they are switched off — not merely unused. You can change your decision at
          any time using the cookie settings link in the footer.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="5. Who we share information with">
        <p>
          We do not sell your personal information. We share it only with the service providers we
          need to run the store, and only the part of it they need:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Payment provider</strong> — to take payment and issue refunds.</li>
          <li><strong>Delivery partners</strong> — your name, address and phone number, so they can deliver.</li>
          <li><strong>Hosting and database providers</strong> — who store the data on our behalf under contract.</li>
          <li><strong>Email provider</strong> — to send order and, where you consented, marketing emails.</li>
          <li><strong>Analytics and advertising platforms</strong> — only where you have consented.</li>
          <li><strong>Authorities</strong> — where we are legally required to disclose.</li>
        </ul>
        <p>
          Some of these providers operate outside your country. Where that happens, transfers are
          made under the safeguards their contracts and applicable law require.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="6. How long we keep it">
        <p>
          Order and payment records are kept for as long as tax and accounting law requires —
          typically five to seven years, depending on jurisdiction. Account data is kept while your
          account is open. Marketing consent records are kept while you are subscribed and for a
          short period afterwards, so we can prove you were removed. Anything we no longer need is
          deleted or anonymised.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="7. Your rights">
        <p>Depending on where you live, you can ask us to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>give you a copy of the personal information we hold about you;</li>
          <li>correct anything that is wrong or out of date;</li>
          <li>delete your information, where we are not required to keep it;</li>
          <li>stop using it for marketing — always, and without giving a reason;</li>
          <li>restrict or object to certain uses; and</li>
          <li>receive your data in a portable format.</li>
        </ul>
        <p>
          You can update your name, phone number and addresses yourself under{" "}
          <Link href="/account/profile" className="font-semibold text-brand-primary hover:underline">
            your account
          </Link>
          . For anything else,{" "}
          {contact.email ? (
            <a href={`mailto:${contact.email}`} className="font-semibold text-brand-primary hover:underline">
              email us
            </a>
          ) : (
            <Link href="/contact" className="font-semibold text-brand-primary hover:underline">
              contact us
            </Link>
          )}{" "}
          and we will respond within the period required by the law that applies to you.
        </p>
      </LegalSection>

      <LegalSection id="security" title="8. How we protect your information">
        <p>
          All traffic to this site is encrypted in transit. Access to the database is restricted by
          row-level security, so one customer&apos;s records cannot be read from another
          customer&apos;s session. Administrative access is limited to authorised staff accounts.
          No system is perfectly secure, but if a breach ever affects your data we will notify you
          and the relevant authority as the law requires.
        </p>
      </LegalSection>

      <LegalSection id="children" title="9. Children">
        <p>
          This store is not intended for children, and we do not knowingly collect information from
          them. If you believe a child has given us personal information, contact us and we will
          delete it.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="10. Changes to this policy">
        <p>
          If we change how we handle personal information we will update this page and revise the
          date at the top. Material changes will be communicated to you directly where the law
          requires it.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
