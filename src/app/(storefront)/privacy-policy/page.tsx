import { getStoreDisplayName } from "@/lib/config/store.config";
import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold font-heading text-slate-900 mb-6">Privacy Policy</h1>
      <p className="text-xs text-slate-400 mb-8">Last Updated: January 1, 2026</p>

      <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-6 leading-relaxed">
        <p>
          At {getStoreDisplayName()} (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), we respect your privacy and are committed
          to protecting personal data collected through our e-commerce platform and services.
        </p>

        <h2 className="text-lg font-bold text-slate-900 mt-6">1. Information We Collect</h2>
        <p>
          We collect personal information necessary to fulfill your orders, provide customer care,
          and personalize your browsing experience:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Identity & Contact Data:</strong> Name, billing/shipping address, email, phone number.</li>
          <li><strong>Transaction Data:</strong> Payment order identifiers, items purchased, currency, totals.</li>
          <li><strong>Technical & Session Data:</strong> IP address, device telemetry, browser type.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-900 mt-6">2. How We Protect Your Payment Data</h2>
        <p>
          We never store complete payment card credentials on our servers. Payment processing is
          delegated directly to certified Tier-1 PCI-DSS compliant providers (Razorpay and Stripe)
          via encrypted tokens and HMAC-SHA256 signatures.
        </p>

        <h2 className="text-lg font-bold text-slate-900 mt-6">3. Data Retention and Rights</h2>
        <p>
          You may request access to, correction of, or erasure of your personal data at any time
          by contacting our privacy officer at <code>concierge@auraluxury.com</code>.
        </p>
      </div>
    </div>
  );
}
