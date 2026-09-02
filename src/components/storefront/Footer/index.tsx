"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, RefreshCw, Truck, Award } from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Value pillars are marketing copy and differ per client, so they are theme
 * defaults rather than fixed component content. Claims that would be untrue
 * for a given deployment (delivery promises, certifications) must be set by
 * the client configuration, never asserted here.
 */
const VALUE_PILLARS = [
  { icon: Truck, title: "Fast Delivery", body: "Tracked shipping on every order." },
  { icon: ShieldCheck, title: "Secure Checkout", body: "Payments handled by your certified gateway." },
  { icon: RefreshCw, title: "Easy Returns", body: "Straightforward exchange and refund process." },
  { icon: Award, title: "Quality Assured", body: "Every item checked before it ships." },
];

export interface FooterProps {
  categories?: { name: string; slug: string }[];
}

export function Footer({ categories = [] }: FooterProps) {
  const { theme } = useTheme();
  const configured = theme.navigation ?? [];
  const navigation =
    configured.length > 1
      ? configured
      : categories.map((c) => ({ label: c.name, href: `/products?category=${c.slug}` }));

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 text-sm">
      {/* Brand Value Pillars */}
      <div className="border-b border-slate-800 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUE_PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="rounded-full bg-slate-800 p-3 text-emerald-400 flex-shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-white text-sm">{title}</h4>
                  <p className="mt-1 text-xs text-slate-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand */}
          <div className="sm:col-span-2 space-y-4">
            <span className="text-2xl font-bold tracking-widest font-heading text-white">
              {theme.brand.name}
            </span>
            {theme.brand.tagline && (
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                {theme.brand.tagline}
              </p>
            )}
          </div>

          {/* Col 2: Shop */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Shop</h4>
            <ul className="space-y-2.5 text-xs">
              {navigation.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Browse All
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  My Account &amp; Orders
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Returns &amp; Exchanges
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Policy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Legal</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-800 pt-8 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} {theme.brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
