"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Mail, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/storefront/auth/AuthShell";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      // Deliberately ignore "user not found": confirming which addresses have
      // accounts turns this form into a customer-list enumeration tool. The
      // success screen is shown either way. Genuine transport failures (network,
      // provider outage) still surface, since those are not an identity oracle.
      if (resetError && !/user|not found|invalid/i.test(resetError.message)) {
        throw resetError;
      }

      setSent(true);
    } catch (caught) {
      const message = (caught as Error)?.message || "";
      setError(
        /rate limit|too many/i.test(message)
          ? "Too many requests. Please wait a few minutes and try again."
          : "We could not send the email right now. Please try again shortly."
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Reset link sent"
        subtitle="If that address has an account, the link is on its way."
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-success/10 text-brand-primary">
            <MailCheck className="h-7 w-7" />
          </span>
          <p className="text-sm leading-relaxed text-brand-muted-ink">
            We sent password reset instructions to{" "}
            <span className="font-semibold text-brand-ink">{email}</span>. The link works once and
            expires after a short time.
          </p>
          <Link href="/login" className="inline-block">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to choose a new one."
      footer={
        <Link href="/login" className="font-semibold text-brand-primary hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-5 flex gap-2 rounded-brand border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          name="email"
          label="Email address"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <Button type="submit" size="lg" isLoading={loading} className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
