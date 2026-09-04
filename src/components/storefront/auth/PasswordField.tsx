"use client";

import React, { useMemo, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Minimum length accepted anywhere in the app. Mirrors the Supabase project setting. */
export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Reasons the password is weak, shown as actionable hints. */
  suggestions: string[];
}

/**
 * Rate a password without shipping a dictionary library.
 *
 * This is a UX aid, not a security control — the authoritative minimum is
 * enforced by Supabase Auth. Its job is to steer people away from the passwords
 * that credential-stuffing lists crack in seconds.
 */
export function ratePassword(password: string): PasswordStrength {
  const suggestions: string[] = [];
  if (!password) {
    return { score: 0, label: "Enter a password", suggestions: [] };
  }

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  else suggestions.push(`Use at least ${MIN_PASSWORD_LENGTH} characters`);

  if (password.length >= 12) score += 1;
  else if (password.length >= MIN_PASSWORD_LENGTH) suggestions.push("12+ characters is much stronger");

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else suggestions.push("Mix upper and lower case");

  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  else suggestions.push("Add a number and a symbol");

  // Sequences and repeats defeat length: "aaaaaaaaaaaa" is not a long password.
  if (/(.)\1{3,}/.test(password) || /(?:0123|1234|2345|abcd|qwerty|password)/i.test(password)) {
    score = Math.max(0, score - 2);
    suggestions.unshift("Avoid repeated characters and common sequences");
  }

  const clamped = Math.min(4, Math.max(0, score)) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

  return { score: clamped, label: labels[clamped], suggestions: suggestions.slice(0, 2) };
}

export interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  /** Show the strength meter. Off for sign-in, on when choosing a password. */
  showStrength?: boolean;
}

export function PasswordField({
  label = "Password",
  error,
  showStrength = false,
  value,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const password = typeof value === "string" ? value : "";
  const strength = useMemo(() => ratePassword(password), [password]);

  const barColors = ["bg-brand-border", "bg-rose-500", "bg-amber-500", "bg-lime-500", "bg-brand-primary"];

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          value={value}
          label={label}
          error={error}
          type={visible ? "text" : "password"}
          leftIcon={<Lock className="h-4 w-4" />}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          // Offset clears the field label above the input.
          className="absolute right-3 top-[30px] text-brand-faint-ink transition-colors hover:text-brand-ink"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && password.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  strength.score >= step ? barColors[strength.score] : "bg-brand-border"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-brand-muted-ink">
            <span className="font-semibold text-brand-muted-ink">{strength.label}.</span>{" "}
            {strength.suggestions.join(". ")}
          </p>
        </div>
      )}
    </div>
  );
}
