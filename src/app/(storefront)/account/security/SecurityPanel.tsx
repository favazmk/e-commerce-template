"use client";

import React, { useState } from "react";
import { AlertCircle, Check, LogOut, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MIN_PASSWORD_LENGTH,
  PasswordField,
  ratePassword,
} from "@/components/storefront/auth/PasswordField";

export function SecurityPanel({ email }: { email: string }) {
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [emailError, setEmailError] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Your new password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The two new passwords do not match.");
      return;
    }
    if (ratePassword(newPassword).score < 2) {
      setPasswordError("Please choose a stronger password — mix cases, numbers and symbols.");
      return;
    }

    setSavingPassword(true);

    try {
      // Re-authenticate first. Supabase's updateUser only requires a valid
      // session, so without this step anyone who reaches an unlocked device
      // could change the password and lock the real owner out — the classic
      // "borrowed laptop" account takeover.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (reauthError) {
        setPasswordError("Your current password is not correct.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (caught) {
      const message = (caught as Error)?.message || "";
      setPasswordError(
        /should be different|same as/i.test(message)
          ? "Your new password must be different from the current one."
          : "We could not change your password. Please try again."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleEmailChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailError("");
    setEmailNotice("");
    setSavingEmail(true);

    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail.trim() },
        { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account/security` }
      );
      if (error) throw error;

      // Supabase sends a confirmation to BOTH addresses by default, so a
      // hijacked session cannot quietly move the account somewhere else.
      setEmailNotice(
        `Confirmation links have been sent to ${email} and ${newEmail}. The change takes effect once both are confirmed.`
      );
      setNewEmail("");
    } catch (caught) {
      const message = (caught as Error)?.message || "";
      setEmailError(
        /already/i.test(message)
          ? "That email address is already in use."
          : "We could not start the email change. Please try again."
      );
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSignOutEverywhere = async () => {
    setSigningOut(true);
    // 'global' revokes every refresh token for this user — the right response
    // to "I think someone else has my password".
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/login?notice=You%20have%20been%20signed%20out%20on%20all%20devices.";
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-brand-ink">Login &amp; security</h1>

      {/* Change password */}
      <form
        onSubmit={handlePasswordChange}
        className="space-y-5 rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6"
      >
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-brand-ink">
          <ShieldCheck className="h-4 w-4 text-brand-primary" /> Change password
        </h2>

        {passwordError && (
          <p
            role="alert"
            className="flex gap-2 rounded-brand bg-brand-danger-surface p-3 text-sm text-brand-danger"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {passwordError}
          </p>
        )}
        {passwordSaved && (
          <p role="status" className="rounded-brand bg-brand-success/10 p-3 text-sm text-brand-success">
            Your password has been changed.
          </p>
        )}

        <PasswordField
          label="Current password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
        <PasswordField
          label="New password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          showStrength
          required
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={
            confirmPassword && confirmPassword !== newPassword ? "Passwords do not match" : undefined
          }
          required
        />

        <Button type="submit" isLoading={savingPassword}>
          <Check className="h-4 w-4" /> Update password
        </Button>
      </form>

      {/* Change email */}
      <form
        onSubmit={handleEmailChange}
        className="space-y-5 rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6"
      >
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-brand-ink">
          <Mail className="h-4 w-4 text-brand-primary" /> Change email address
        </h2>
        <p className="text-xs text-brand-muted-ink">
          Currently <span className="font-semibold text-brand-ink">{email}</span>. We will email
          both the old and the new address to confirm.
        </p>

        {emailError && (
          <p role="alert" className="rounded-brand bg-brand-danger-surface p-3 text-sm text-brand-danger">
            {emailError}
          </p>
        )}
        {emailNotice && (
          <p role="status" className="rounded-brand bg-brand-success/10 p-3 text-sm text-brand-success">
            {emailNotice}
          </p>
        )}

        <Input
          type="email"
          label="New email address"
          autoComplete="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          placeholder="new@example.com"
          required
        />

        <Button type="submit" variant="outline" isLoading={savingEmail}>
          Send confirmation links
        </Button>
      </form>

      {/* Sessions */}
      <div className="space-y-4 rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-brand-ink">
          <LogOut className="h-4 w-4 text-brand-muted-ink" /> Active sessions
        </h2>
        <p className="text-xs leading-relaxed text-brand-muted-ink">
          Signed in on a shared or lost device? This signs you out everywhere at once and forces a
          fresh login on every device.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOutEverywhere}
          isLoading={signingOut}
        >
          Sign out on all devices
        </Button>
      </div>
    </div>
  );
}
