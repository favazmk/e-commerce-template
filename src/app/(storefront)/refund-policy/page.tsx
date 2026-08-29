import React from "react";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold font-heading text-slate-900 mb-6">Returns & Refund Policy</h1>
      <p className="text-xs text-slate-400 mb-8">30-Day Effortless Client Guarantee</p>

      <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-6 leading-relaxed">
        <p>
          We stand behind the unmatched quality of our bespoke goods. If you are not entirely satisfied
          with your purchase, we welcome returns and exchanges within 30 days of delivery.
        </p>

        <h2 className="text-lg font-bold text-slate-900 mt-6">Return Eligibility</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Items must be unworn, unwashed, and in their original packaging with security tags intact.</li>
          <li>Footwear must be tried on carpeted surfaces only to prevent sole scuffing.</li>
          <li>Custom bespoke monogrammed items are non-refundable unless defective.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-900 mt-6">Refund Processing</h2>
        <p>
          Upon receipt and inspection by our master artisans, refunds are initiated within 3–5 business days
          directly to your original payment method.
        </p>
      </div>
    </div>
  );
}
