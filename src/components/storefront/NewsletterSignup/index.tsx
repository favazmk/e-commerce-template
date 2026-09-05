"use client";

import React, { useState } from "react";
import { Check, Send } from "lucide-react";

export interface NewsletterSignupProps {
  /** Where the sign-up happened, for attribution. */
  source?: string;
  compact?: boolean;
}

/**
 * Newsletter capture.
 *
 * Note what this deliberately does not do: no pre-ticked consent box, no
 * interstitial popup, no "no thanks, I hate savings" shame button. Consent has
 * to be a positive act to be valid, and the dark-pattern versions of this
 * widget are both unlawful in most markets and worse at building a list people
 * actually open.
 */
export function NewsletterSignup({ source = "footer", compact = false }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    setError("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload?.error?.message || "Could not sign you up.");
        setStatus("idle");
        return;
      }

      setStatus("done");
      setEmail("");
    } catch {
      setError("Network problem — please try again.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <p className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
        <Check className="h-4 w-4" /> You are on the list. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-3"}>
      <label htmlFor={`newsletter-${source}`} className="sr-only">
        Email address
      </label>
      <div className="flex gap-2">
        <input
          id={`newsletter-${source}`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          required
          className="min-w-0 flex-1 rounded-brand border border-brand-ink/50 bg-brand-ink px-3 py-2 text-xs text-white placeholder-brand-faint-ink focus:border-brand-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-brand bg-brand-primary px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-primary-hover disabled:opacity-60"
        >
          <Send className="h-3.5 w-3.5" />
          {status === "saving" ? "…" : "Join"}
        </button>
      </div>
      {error && <p className="text-xs text-brand-danger">{error}</p>}
      <p className="text-[11px] leading-relaxed text-brand-muted-ink">
        New arrivals and offers. Unsubscribe in one click, any time.
      </p>
    </form>
  );
}
