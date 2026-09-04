"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/storefront/auth/AuthShell";
import {
  MIN_PASSWORD_LENGTH,
  PasswordField,
  ratePassword,
} from "@/components/storefront/auth/PasswordField";

type SessionState = "checking" | "ready" | "invalid";

/**
 * Choose a new password after following a recovery link.
 *
 * The recovery link goes to /auth/callback, which exchanges the one-time code
 * for a session and redirects here. So by the time this page renders there must
 * already be a session — if there is not, the link was reused, expired, or the
 * page was opened directly, and no password change may be offered.
 */
export default function ResetPasswordPage() {
  const supabase = createClient();

  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSessionState(data.session ? "ready" : "invalid");
    });

    return () => {
      active = false;
    };
  }, [supabase]);

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
    if (ratePassword(password).score < 2) {
      setError("Please choose a stronger password — mix cases, numbers and symbols.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Invalidate the recovery session so the reset link cannot be replayed,
      // and force a deliberate sign-in with the new password.
      await supabase.auth.signOut();
      setDone(true);
    } catch (caught) {
      const message = (caught as Error)?.message || "";
      setError(
        /same as the old|should be different/i.test(message)
          ? "That is your current password. Please choose a different one."
          : "We could not update your password. Please request a fresh reset link."
      );
    } finally {
      setLoading(false);
    }
  };

  if (sessionState === "checking") {
    return (
      <div className="px-4 py-24 text-center text-sm text-brand-muted-ink">Verifying your link…</div>
    );
  }

  if (sessionState === "invalid") {
    return (
      <AuthShell
        eyebrow="Link problem"
        title="This reset link is no longer valid"
        subtitle="Reset links work once and expire quickly, for your protection."
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="h-7 w-7" />
          </span>
          <p className="text-sm text-brand-muted-ink">Request a new link and try again.</p>
          <Link href="/forgot-password" className="inline-block">
            <Button size="sm">Request a new link</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell eyebrow="All set" title="Password updated" subtitle="You can now sign in.">
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-success/10 text-brand-primary">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="text-sm text-brand-muted-ink">
            For safety we signed you out everywhere. Sign in with your new password to continue.
          </p>
          <Link href="/login?notice=Your%20password%20was%20updated." className="inline-block">
            <Button size="sm">Go to sign in</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Pick something you have not used on another site."
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
        <PasswordField
          name="password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          showStrength
          required
        />

        <PasswordField
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat your new password"
          error={
            confirmPassword && confirmPassword !== password ? "Passwords do not match" : undefined
          }
          required
        />

        <Button type="submit" size="lg" isLoading={loading} className="w-full">
          <ShieldCheck className="h-4 w-4" /> Update password
        </Button>
      </form>
    </AuthShell>
  );
}
