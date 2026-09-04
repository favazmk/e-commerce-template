"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-xl mx-auto mb-16">
        <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">
          Client Concierge
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-brand-ink mt-1">
          How May We Assist You?
        </h1>
        <p className="mt-2 text-sm text-brand-muted-ink">
          Our client advisory team is available Monday through Friday to address bespoke inquiries,
          sizing consultations, and order assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-brand-xl bg-brand-ink text-white p-8 shadow-float space-y-6">
            <h2 className="text-xl font-bold font-heading">Direct Concierge</h2>

            <div className="space-y-4 text-xs text-brand-faint-ink">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-brand-primary flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Email Advisory</p>
                  <p>concierge@auraluxury.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-brand-primary flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Telephone Inquiries</p>
                  <p>+1 (800) 555-0199</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-primary flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Showroom & Headquarters</p>
                  <p>740 Madison Avenue, New York, NY 10065</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="rounded-brand-xl border border-brand-border bg-white p-8 shadow-subtle">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-success/15 text-brand-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-ink">Message Received</h3>
                <p className="text-xs text-brand-muted-ink max-w-sm mx-auto">
                  Thank you for contacting us. A dedicated concierge advisor will respond to your
                  inquiry within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Your Name" required placeholder="Jane Doe" />
                  <Input label="Email Address" type="email" required placeholder="jane@example.com" />
                </div>
                <Input label="Subject / Order Number" placeholder="e.g. Inquiring about overcoat sizing" />
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted-ink">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="block w-full rounded-brand border border-brand-border-strong p-3 text-sm focus:border-brand-ink focus:outline-none"
                    placeholder="Provide details about your request..."
                  />
                </div>
                <Button type="submit" variant="primary" size="md" className="w-full gap-2">
                  <Send className="h-4 w-4" /> Send Concierge Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
