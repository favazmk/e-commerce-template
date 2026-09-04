"use client";

import React, { useState } from "react";
import { BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface BackInStockFormProps {
  productId: string;
  variantId?: string | null;
  productName: string;
}

/**
 * "Email me when it's back" capture for a sold-out product.
 *
 * An out-of-stock product page is otherwise a dead end: the shopper leaves and
 * usually does not return. Capturing the address converts the restock into a
 * warm, already-interested audience — and it is a genuine service to the
 * shopper rather than a pressure tactic.
 */
export function BackInStockForm({ productId, variantId, productName }: BackInStockFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    setError("");

    try {
      const response = await fetch("/api/notify/back-in-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId: variantId || null, email }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload?.error?.message || "Could not register your interest.");
        setStatus("idle");
        return;
      }

      setStatus("done");
    } catch {
      setError("Network problem — please try again.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="flex items-start gap-3 rounded-brand-xl border border-brand-success/30 bg-brand-success/10 p-4">
        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary" />
        <div>
          <p className="text-sm font-semibold text-brand-success">You are on the list</p>
          <p className="mt-0.5 text-xs text-brand-primary">
            We will email you the moment {productName} is back in stock.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-brand-xl border border-brand-border bg-brand-subtle p-4"
    >
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-muted-ink" />
        <div>
          <p className="text-sm font-semibold text-brand-ink">Sold out — want to know when it returns?</p>
          <p className="mt-0.5 text-xs text-brand-muted-ink">
            One email when it is back. Nothing else, and no sign-up needed.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-label="Email address for restock alert"
          autoComplete="email"
          inputMode="email"
          error={error}
          required
        />
        <Button type="submit" isLoading={status === "saving"} className="sm:self-start">
          Notify me
        </Button>
      </div>
    </form>
  );
}
