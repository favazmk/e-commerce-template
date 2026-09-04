"use client";

import React from "react";
import Link from "next/link";
import { Award, Mail, MapPin, Phone, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";
import { useConsent } from "@/features/consent/ConsentContext";
import { NewsletterSignup } from "@/components/storefront/NewsletterSignup";

/**
 * Value pillars are marketing copy and differ per client, so they are theme
 * defaults rather than fixed component content. Claims that would be untrue
 * for a given deployment (delivery promises, certifications) must be set by
 * the client configuration, never asserted here.
 */
const VALUE_PILLARS = [
  { icon: Truck, title: "Tracked delivery", body: "Every order shipped with tracking." },
  { icon: ShieldCheck, title: "Secure checkout", body: "Card details never touch our servers." },
  { icon: RefreshCw, title: "Easy returns", body: "Start a return from your account." },
  { icon: Award, title: "Checked before dispatch", body: "Every item inspected before it ships." },
];

export interface FooterProps {
  categories?: { name: string; slug: string }[];
}

export function Footer({ categories = [] }: FooterProps) {
  const { theme } = useTheme();
  const { reopen } = useConsent();

  const configured = theme.navigation ?? [];
  const navigation =
    configured.length > 1
      ? configured
      : categories.map((category) => ({
          label: category.name,
          href: `/categories/${category.slug}`,
        }));

  // Contact details are per-client configuration, so each line only renders
  // when the deployment has actually supplied it.
  const email = process.env.NEXT_PUBLIC_STORE_EMAIL?.trim();
  const phone = process.env.NEXT_PUBLIC_STORE_PHONE?.trim();
  const city = process.env.NEXT_PUBLIC_STORE_CITY?.trim();
  const country = process.env.NEXT_PUBLIC_STORE_COUNTRY?.trim();

  const trackingConfigured = Boolean(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
      process.env.NEXT_PUBLIC_GTM_ID ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID
  );

  return (
    <footer className="border-t border-brand-border bg-brand-ink text-sm text-brand-faint-ink">
      {/* Value pillars */}
      <div className="border-b border-brand-ink/40 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {VALUE_PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 rounded-full bg-brand-ink p-2.5 text-brand-primary sm:p-3">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-white sm:text-sm">{title}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-brand-faint-ink sm:text-xs">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-5">
          {/* Brand + newsletter */}
          <div className="col-span-2 space-y-5">
            <span className="font-heading text-2xl font-bold tracking-widest text-white">
              {theme.brand.name}
            </span>
            {theme.brand.tagline && (
              <p className="max-w-sm text-xs leading-relaxed text-brand-faint-ink">
                {theme.brand.tagline}
              </p>
            )}

            <div className="max-w-sm">
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-white">
                Stay in the loop
              </h3>
              <NewsletterSignup source="footer" />
            </div>

            {(email || phone || city) && (
              <address className="space-y-1.5 text-xs not-italic text-brand-faint-ink">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 transition-colors hover:text-white"
                  >
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" /> {email}
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 transition-colors hover:text-white"
                  >
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" /> {phone}
                  </a>
                )}
                {city && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {[city, country].filter(Boolean).join(", ")}
                  </span>
                )}
              </address>
            )}
          </div>

          {/* Shop */}
          <nav aria-labelledby="footer-shop">
            <h3 id="footer-shop" className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Shop
            </h3>
            <ul className="space-y-2.5 text-xs">
              {navigation.slice(0, 6).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="transition-colors hover:text-white">
                  Browse all
                </Link>
              </li>
            </ul>
          </nav>

          {/* Customer care */}
          <nav aria-labelledby="footer-care">
            <h3 id="footer-care" className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Help
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/track-order" className="transition-colors hover:text-white">
                  Track my order
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="transition-colors hover:text-white">
                  My orders
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="transition-colors hover:text-white">
                  Returns &amp; refunds
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="transition-colors hover:text-white">
                  Shipping &amp; delivery
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-white">
                  Contact us
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-labelledby="footer-legal">
            <h3 id="footer-legal" className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Legal
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/privacy-policy" className="transition-colors hover:text-white">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-white">
                  Terms &amp; conditions
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="transition-colors hover:text-white">
                  Refund policy
                </Link>
              </li>
              {trackingConfigured && (
                <li>
                  {/* Consent must be as easy to withdraw as it was to give. */}
                  <button
                    type="button"
                    onClick={reopen}
                    className="transition-colors hover:text-white hover:underline"
                  >
                    Cookie settings
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-brand-ink/40 pt-8 text-xs text-brand-muted-ink sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {theme.brand.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
            Secure encrypted checkout
          </p>
        </div>
      </div>
    </footer>
  );
}
