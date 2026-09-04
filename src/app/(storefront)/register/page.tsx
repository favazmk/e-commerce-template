"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, MailCheck, User as UserIcon, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/storefront/auth/AuthShell";
import {
  MIN_PASSWORD_LENGTH,
  PasswordField,
  ratePassword,
} from "@/components/storefront/auth/PasswordField";
import { safeRedirectPath } from "@/lib/security/safe-redirect";

function RegisterForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const redirectTo = safeRedirectPath(searchParams.get("redirectTo"), "/account");
  const strength = ratePassword(password);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }
    if (strength.score < 2) {
      setError("Please choose a stronger password — mix cases, numbers and symbols.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          // Confirmation links come back through our own callback route, which
          // exchanges the code for an httpOnly session cookie server-side.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTo
          )}`,
        },
      });

      if (signUpError) throw signUpError;

      // With email confirmation enabled, Supabase returns a user but no session.
      if (data.session) {
        window.location.href = redirectTo;
        return;
      }

      setConfirmationSent(true);
    } catch (caught) {
      const message = (caught as Error)?.message || "";
      setError(
        message.toLowerCase().includes("already registered")
          ? "An account already exists for this email. Try signing in instead."
          : message || "We could not create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <AuthShell
        eyebrow="One last step"
        title="Confirm your email"
        subtitle="Your account is created — we just need to check the address is yours."
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-success/10 text-brand-primary">
            <MailCheck className="h-7 w-7" />
          </span>
          <p className="text-sm leading-relaxed text-brand-muted-ink">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-brand-ink">{email}</span>. Open it and you will be
            signed in automatically.
          </p>
          <p className="text-xs text-brand-faint-ink">
            Nothing after a few minutes? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={() => setConfirmationSent(false)}
              className="font-semibold text-brand-primary hover:underline"
            >
              try a different address
            </button>
            .
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Create your account"
      title="Join in under a minute"
      subtitle="Faster checkout, saved addresses and order tracking."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="font-semibold text-brand-primary hover:underline"
          >
            Sign in
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          name="name"
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          leftIcon={<UserIcon className="h-4 w-4" />}
          required
        />

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

        <PasswordField
          name="password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          showStrength
          minLength={MIN_PASSWORD_LENGTH}
          required
        />

        <PasswordField
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat your password"
          error={
            confirmPassword && confirmPassword !== password ? "Passwords do not match" : undefined
          }
          required
        />

        <Button type="submit" size="lg" isLoading={loading} className="w-full">
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<div className="px-4 py-24 text-center text-sm text-brand-muted-ink">Loading…</div>}
    >
      <RegisterForm />
    </Suspense>
  );
}
