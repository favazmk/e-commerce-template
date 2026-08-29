import React from "react";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold font-heading text-slate-900 mb-6">Terms of Service</h1>
      <p className="text-xs text-slate-400 mb-8">Effective Date: January 1, 2026</p>

      <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-6 leading-relaxed">
        <p>
          Please review these Terms of Service prior to acquiring products or utilizing services
          offered by AURA LUXURY. By accessing our platform, you agree to be bound by these provisions.
        </p>

        <h2 className="text-lg font-bold text-slate-900 mt-6">1. Commercial Transactions & Pricing</h2>
        <p>
          All orders are subject to acceptance and item availability. We reserve the right to decline
          orders due to pricing discrepancies, technical errors, or inventory constraints.
        </p>

        <h2 className="text-lg font-bold text-slate-900 mt-6">2. Intellectual Property</h2>
        <p>
          All trademarks, designs, imagery, typography, and code architecture remain the exclusive
          property of the brand and its licensors.
        </p>
      </div>
    </div>
  );
}
