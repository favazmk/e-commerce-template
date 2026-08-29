import React from "react";
import Link from "next/link";
import { ShieldCheck, RefreshCw, Truck, Award } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 text-sm">
      {/* Brand Value Pillars */}
      <div className="border-b border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-slate-800 p-3 text-emerald-400 flex-shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Global Express Delivery</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Complimentary tracked courier on orders over $200.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-slate-800 p-3 text-emerald-400 flex-shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Secure Checkout</h4>
                <p className="mt-1 text-xs text-slate-400">
                  256-bit SSL encryption powered by Razorpay & Stripe.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-slate-800 p-3 text-emerald-400 flex-shrink-0">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">30-Day Effortless Returns</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Hassle-free exchange and full refund policy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-slate-800 p-3 text-emerald-400 flex-shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Artisanal Quality</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Ethically crafted using premium certified materials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Col 1: Brand */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-2xl font-bold tracking-widest font-heading text-white">
              AURA LUXURY
            </span>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              An agency-grade modular commerce engine designed for bespoke multi-client deployment.
              Crafted with Next.js 15, TypeScript, Tailwind, and scalable cloud architecture.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Access Merchant Admin Portal →
              </Link>
            </div>
          </div>

          {/* Col 2: Collections */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/categories/luxury-apparel" className="hover:text-white transition-colors">
                  Luxury Apparel
                </Link>
              </li>
              <li>
                <Link href="/categories/artisanal-footwear" className="hover:text-white transition-colors">
                  Artisanal Footwear
                </Link>
              </li>
              <li>
                <Link href="/categories/designer-accessories" className="hover:text-white transition-colors">
                  Designer Accessories
                </Link>
              </li>
              <li>
                <Link href="/categories/home-and-living" className="hover:text-white transition-colors">
                  Home & Living
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Browse All Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Client Concierge
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  My Account & Orders
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping & Customs
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Returns & Exchanges
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Legal & Trust
            </h4>
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
        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Aura Luxury Inc. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Razorpay Verified</span>
            <span>Stripe Ready</span>
            <span>PCI-DSS Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
