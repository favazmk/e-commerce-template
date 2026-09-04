"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/storefront/auth/AuthShell";
import { PasswordField } from "@/components/storefront/auth/PasswordField";
import { safeRedirectPath } from "@/lib/security/safe-redirect";

/**
 * Map a Supabase auth error to copy that is useful without being an oracle.
 *
 * "No account exists for this email" would let anyone enumerate the customer
 * list one address at a time, so a wrong email and a wrong password produce the
 * same message.
 */
function friendlyAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) {
    return "That email and password combination does not match an account.";
  }
  if (text.includes("email not confirmed")) {
    return "Please confirm your email address first — check your inbox for the link we sent.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }
  return "We could not sign you in. Please try again.";
}

function LoginForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") || "");
  const [notice, setNotice] = useState(searchParams.get("notice") || "");
  const [loading, setLoading] = useState(false);

  // Never hand a caller-supplied destination straight to the browser.
  const redirectTo = safeRedirectPath(searchParams.get("redirectTo"), "/account");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;

      // A full navigation (not router.push) so every Server Component re-renders
      // with the new session cookie attached.
      window.location.href = redirectTo;
    } catch (caught) {
      setError(friendlyAuthError((caught as Error)?.message || ""));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your account"
      subtitle="Track orders, save addresses and check out faster."
      footer={
        <>
          New here?{" "}
          <Link
            href={`/register?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="font-semibold text-brand-primary hover:underline"
          >
            Create an account
          </Link>
        </>
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

      {notice && (
        <div
          role="status"
          className="mb-5 flex gap-2 rounded-brand border border-brand-success/30 bg-brand-success/10 p-3 text-sm text-brand-success"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{notice}</span>
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

        <div className="space-y-2">
          <PasswordField
            name="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            required
          />
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand-muted-ink hover:text-brand-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" isLoading={loading} className="w-full">
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="px-4 py-24 text-center text-sm text-brand-muted-ink">Loading…</div>}
    >
      <LoginForm />
    </Suspense>
  );
}
