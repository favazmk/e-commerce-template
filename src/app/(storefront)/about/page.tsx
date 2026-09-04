import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Award, HeartHandshake, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { getStoreDisplayName } from "@/lib/config/store.config";
import { canonicalUrl, getStoreContact, getStoreDescription } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { Button } from "@/components/ui/button";

/**
 * About page.
 *
 * Exists because several places link here — the homepage banner CTA in the
 * seed data among them — and because a store with no "about" page is a trust
 * problem: it is one of the first things a cautious first-time buyer looks for,
 * and payment providers check for it during merchant review.
 *
 * The copy is deliberately generic and configuration-driven. A client's real
 * story belongs in their own repository (AGENTS.md sections 9 and 25); this is
 * a working, honest placeholder that says nothing untrue about any store.
 */

export const metadata: Metadata = {
  title: "About us",
  description: `Who we are, how we work, and what to expect when you order from ${getStoreDisplayName()}.`,
  alternates: { canonical: canonicalUrl("/about") },
};

export default function AboutPage() {
  const storeName = getStoreDisplayName();
  const contact = getStoreContact();
  const tagline = process.env.NEXT_PUBLIC_STORE_TAGLINE?.trim();

  const commitments = [
    {
      icon: PackageCheck,
      title: "Everything is checked before it ships",
      body: "Each order is inspected and packed by hand. If something is not right, it does not go out.",
    },
    {
      icon: Truck,
      title: "Tracked from our door to yours",
      body: "You get a confirmation when you order and a tracking link when it ships, then updates until it arrives.",
    },
    {
      icon: HeartHandshake,
      title: "Straightforward returns",
      body: "If it is not what you hoped for, start a return from your account. No argument, no runaround.",
    },
    {
      icon: ShieldCheck,
      title: "Your details stay yours",
      body: "Card details never touch our servers, and we do not sell your information to anyone.",
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About us", path: "/about" },
        ])}
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="border-b border-brand-border pb-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-primary">
            About us
          </span>
          <h1 className="mt-2 font-heading text-3xl font-bold text-brand-ink sm:text-4xl">
            {tagline || `The story behind ${storeName}`}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-muted-ink">
            {getStoreDescription()}
          </p>
        </header>

        <section className="mt-10">
          <h2 className="font-heading text-xl font-bold text-brand-ink">What we care about</h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted-ink">
            We would rather carry fewer things and stand behind all of them than carry everything
            and stand behind none of it. Every product on this site is one we would be happy to
            receive ourselves.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {commitments.map((item) => (
              <div
                key={item.title}
                className="rounded-brand-lg border border-brand-border bg-white p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-brand-ink">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-brand-muted-ink">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-brand-lg border border-brand-border bg-brand-subtle p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-ink">
            <Award className="h-5 w-5 text-brand-primary" /> Talk to a person
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted-ink">
            Questions about an order, a size, or whether something is right for you — ask. A real
            person reads every message.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact">
              <Button size="sm">Contact us</Button>
            </Link>
            <Link href="/track-order">
              <Button size="sm" variant="outline">
                Track an order
              </Button>
            </Link>
            {contact.email && (
              <a href={`mailto:${contact.email}`}>
                <Button size="sm" variant="ghost">
                  {contact.email}
                </Button>
              </a>
            )}
          </div>
        </section>

        <section className="mt-10 border-t border-brand-border pt-8">
          <h2 className="font-heading text-lg font-bold text-brand-ink">The details</h2>
          <ul className="mt-3 space-y-2 text-sm text-brand-muted-ink">
            <li>
              <Link href="/shipping-policy" className="font-semibold text-brand-primary hover:underline">
                Shipping &amp; delivery
              </Link>{" "}
              — what it costs and how long it takes.
            </li>
            <li>
              <Link href="/refund-policy" className="font-semibold text-brand-primary hover:underline">
                Returns &amp; refunds
              </Link>{" "}
              — how to send something back.
            </li>
            <li>
              <Link href="/privacy-policy" className="font-semibold text-brand-primary hover:underline">
                Privacy policy
              </Link>{" "}
              — what we collect and why.
            </li>
            <li>
              <Link href="/terms" className="font-semibold text-brand-primary hover:underline">
                Terms &amp; conditions
              </Link>{" "}
              — the rules that apply when you buy.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
