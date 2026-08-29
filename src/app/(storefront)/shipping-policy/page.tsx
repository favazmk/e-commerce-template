import React from "react";

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold font-heading text-slate-900 mb-6">Shipping & Delivery Standards</h1>
      <p className="text-xs text-slate-400 mb-8">Global Insured Courier Services</p>

      <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-6 leading-relaxed">
        <p>
          Every shipment is securely packaged in our signature reinforced archival packaging and
          insured against loss or damage throughout transit.
        </p>

        <h2 className="text-lg font-bold text-slate-900 mt-6">Delivery Zones & Estimates</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left border border-slate-200 mt-4">
            <thead className="bg-slate-100 font-bold uppercase text-slate-700">
              <tr>
                <th className="p-3 border-b">Destination Zone</th>
                <th className="p-3 border-b">Courier Tier</th>
                <th className="p-3 border-b">Estimated Transit</th>
                <th className="p-3 border-b">Standard Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold">United States & Canada</td>
                <td className="p-3">Priority Ground</td>
                <td className="p-3">2–4 Business Days</td>
                <td className="p-3">$15 (Free over $200)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">United Arab Emirates & GCC</td>
                <td className="p-3">Express Air Courier</td>
                <td className="p-3">3–5 Business Days</td>
                <td className="p-3">$25 (Free over $300)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Europe & United Kingdom</td>
                <td className="p-3">DHL Express International</td>
                <td className="p-3">3–5 Business Days</td>
                <td className="p-3">$30 (Free over $350)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Rest of World</td>
                <td className="p-3">DHL Priority Worldwide</td>
                <td className="p-3">4–7 Business Days</td>
                <td className="p-3">$45 (Free over $500)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
