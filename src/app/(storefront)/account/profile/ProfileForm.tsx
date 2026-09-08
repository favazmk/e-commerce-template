"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Mail, Phone, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@/types/database";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();

  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        if (payload?.error?.fields) setFieldErrors(payload.error.fields);
        setError(payload?.error?.message || "Could not save your details.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-brand-ink">Profile</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-brand-xl border border-brand-border bg-white p-5 shadow-subtle sm:p-6"
      >
        {error && (
          <p role="alert" className="rounded-brand bg-brand-danger-surface p-3 text-sm text-brand-danger">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="rounded-brand bg-brand-success/10 p-3 text-sm text-brand-success">
            Your details have been saved.
          </p>
        )}

        <Input
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          leftIcon={<UserIcon className="h-4 w-4" />}
          error={fieldErrors.name?.[0]}
          required
        />

        <Input
          label="Phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          leftIcon={<Phone className="h-4 w-4" />}
          helperText="Used for delivery updates only."
          error={fieldErrors.phone?.[0]}
        />

        {/* Email is the account identifier. Changing it has to re-verify the new
            address, so it is handled in Login & security rather than here — an
            editable-looking field that silently does nothing is worse than a
            read-only one. */}
        <Input
          label="Email address"
          value={user.email}
          leftIcon={<Mail className="h-4 w-4" />}
          helperText="Your sign-in address. Change it under Login & security."
          disabled
          readOnly
        />

        <Button type="submit" isLoading={saving}>
          <Check className="h-4 w-4" /> Save changes
        </Button>
      </form>
    </div>
  );
}
