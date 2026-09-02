"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Save, Truck, ToggleLeft, Plus, Trash2, History, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrencyLabel } from "@/lib/config/store.config";

/** One shipping option a customer can pick at checkout. */
interface ShippingZone {
  id: string;
  name: string;
  rate: number | string;
  free_threshold: number | string | null;
  estimated_days: string;
}

interface FeatureFlags {
  guest_checkout_enabled: boolean;
  wishlist_enabled: boolean;
  reviews_enabled: boolean;
}

export default function AdminSettingsPage() {
  const currency = getCurrencyLabel();

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [defaultFlatRate, setDefaultFlatRate] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
  const [shippingEnabled, setShippingEnabled] = useState(true);

  const [features, setFeatures] = useState<FeatureFlags>({
    guest_checkout_enabled: true,
    wishlist_enabled: true,
    reviews_enabled: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [savingArea, setSavingArea] = useState<"shipping" | "features" | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const notify = (tone: "ok" | "error", text: string) => {
    setFeedback({ tone, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();

      if (!data.success) {
        notify("error", data.error?.message || "Could not load settings.");
        return;
      }

      const shipping = data.data.settings?.shipping || {};
      setZones(
        Array.isArray(shipping.zones)
          ? shipping.zones.map((z: any) => ({
              id: z.id,
              name: z.name ?? "",
              rate: z.rate ?? 0,
              free_threshold: z.free_threshold ?? "",
              estimated_days: z.estimated_days ?? "",
            }))
          : []
      );
      setDefaultFlatRate(String(shipping.default_flat_rate ?? ""));
      setFreeShippingThreshold(String(shipping.free_shipping_threshold ?? ""));
      setShippingEnabled(shipping.enabled !== false);

      const flags = data.data.settings?.features || {};
      setFeatures({
        guest_checkout_enabled: flags.guest_checkout_enabled !== false,
        wishlist_enabled: flags.wishlist_enabled !== false,
        reviews_enabled: flags.reviews_enabled === true,
      });
    } catch {
      notify("error", "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const updateZone = (index: number, patch: Partial<ShippingZone>) => {
    setZones((prev) => prev.map((z, i) => (i === index ? { ...z, ...patch } : z)));
  };

  const addZone = () => {
    setZones((prev) => [
      ...prev,
      {
        id: `zone-${Date.now().toString(36)}`,
        name: "",
        rate: 0,
        free_threshold: "",
        estimated_days: "",
      },
    ]);
  };

  const saveShipping = async (e: React.FormEvent) => {
    e.preventDefault();

    const unnamed = zones.findIndex((z) => !String(z.name).trim());
    if (unnamed !== -1) {
      notify("error", `Shipping option ${unnamed + 1} needs a name customers will recognise.`);
      return;
    }

    setSavingArea("shipping");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "shipping",
          data: {
            enabled: shippingEnabled,
            default_flat_rate: Number(defaultFlatRate) || 0,
            free_shipping_threshold: Number(freeShippingThreshold) || 0,
            zones: zones.map((z) => ({
              id: z.id,
              name: String(z.name).trim(),
              rate: Number(z.rate) || 0,
              // An empty threshold means "this option is never free".
              free_threshold:
                String(z.free_threshold).trim() === "" ? null : Number(z.free_threshold),
              estimated_days: String(z.estimated_days).trim(),
            })),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Save failed.");

      notify("ok", "Shipping rates saved. They apply to new checkouts immediately.");
      await fetchSettings();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setSavingArea(null);
    }
  };

  const saveFeatures = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingArea("features");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "features", data: features }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Save failed.");

      notify("ok", "Feature switches saved and live on the storefront.");
      await fetchSettings();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setSavingArea(null);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-slate-400">Loading settings…</p>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
          Store Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Shipping &amp; Store Features
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Every change here is recorded and can be undone from{" "}
          <Link href="/admin/history" className="font-semibold text-emerald-700 hover:underline">
            Change History
          </Link>
          .
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-brand border p-3 text-xs font-semibold ${
            feedback.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* ---------------------------------------------------- Shipping ---- */}
      <form
        onSubmit={saveShipping}
        className="rounded-brand-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-subtle space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Truck className="h-4 w-4 text-slate-700" /> Shipping Rates
          </h2>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={savingArea === "shipping"}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" /> Save shipping
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={`Free Shipping Threshold (${currency})`}
            type="number"
            min="0"
            step="0.01"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
            helperText="Shown to customers as “spend X more for free shipping”. Set 0 to never offer it."
          />
          <Input
            label={`Standard Flat Rate (${currency})`}
            type="number"
            min="0"
            step="0.01"
            value={defaultFlatRate}
            onChange={(e) => setDefaultFlatRate(e.target.value)}
            helperText="Fallback rate when no shipping option matches."
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={shippingEnabled}
            onChange={(e) => setShippingEnabled(e.target.checked)}
          />
          Charge for shipping (unticking makes every order ship free)
        </label>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Shipping options offered at checkout
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addZone} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add option
            </Button>
          </div>

          {zones.length === 0 ? (
            <p className="rounded-brand border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400">
              No shipping options yet. Add at least one so customers have something to choose.
            </p>
          ) : (
            <div className="space-y-3">
              {zones.map((zone, idx) => (
                <div
                  key={zone.id}
                  className="rounded-brand border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <Input
                        label="Option name (customers see this)"
                        required
                        value={zone.name}
                        onChange={(e) => updateZone(idx, { name: e.target.value })}
                        placeholder="e.g. UAE & GCC Express Courier"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setZones((prev) => prev.filter((_, i) => i !== idx))}
                      className="mt-6 rounded-brand p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Remove this shipping option"
                      aria-label={`Remove ${zone.name || "shipping option"}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label={`Rate (${currency})`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={zone.rate}
                      onChange={(e) => updateZone(idx, { rate: e.target.value })}
                    />
                    <Input
                      label={`Free above (${currency})`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={zone.free_threshold ?? ""}
                      onChange={(e) => updateZone(idx, { free_threshold: e.target.value })}
                      placeholder="Never free"
                    />
                    <Input
                      label="Delivery estimate"
                      value={zone.estimated_days}
                      onChange={(e) => updateZone(idx, { estimated_days: e.target.value })}
                      placeholder="3-5 Business Days"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* ---------------------------------------------------- Features ---- */}
      <form
        onSubmit={saveFeatures}
        className="rounded-brand-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-subtle space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <ToggleLeft className="h-4 w-4 text-slate-700" /> Store Features
          </h2>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={savingArea === "features"}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" /> Save features
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          <label className="flex items-start gap-3 py-3.5 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={features.guest_checkout_enabled}
              onChange={(e) =>
                setFeatures({ ...features, guest_checkout_enabled: e.target.checked })
              }
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Guest checkout</span>
              <span className="block text-xs text-slate-500">
                Let customers buy without creating an account. Switched off, the checkout asks
                them to sign in first — and the order is refused server-side even if someone
                tries to bypass the page.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 py-3.5 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={features.wishlist_enabled}
              onChange={(e) => setFeatures({ ...features, wishlist_enabled: e.target.checked })}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Customer wishlist</span>
              <span className="block text-xs text-slate-500">
                Shows the heart button on product cards and the wishlist link in the header.
                Switched off, both disappear and saved lists are kept untouched.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 py-3.5 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={features.reviews_enabled}
              onChange={(e) => setFeatures({ ...features, reviews_enabled: e.target.checked })}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Product reviews</span>
              <span className="block text-xs text-slate-500">
                Shows the reviews section on every product page, where customers can read reviews
                and write their own. Nothing appears publicly until you publish it in{" "}
                <Link href="/admin/reviews" className="font-semibold text-emerald-700 hover:underline">
                  Product Reviews
                </Link>
                . Switched off, the whole section disappears and submissions are refused.
              </span>
            </span>
          </label>
        </div>

        <div className="flex items-start gap-2.5 rounded-brand border border-slate-200 bg-slate-50 p-3">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
          <p className="text-[11px] text-slate-600">
            Tax rates, brand colours, currency and payment keys are not on this page on purpose —
            a wrong value there mis-charges every order until someone notices. Those stay with the
            development team, where a change is reviewed before it goes live.
          </p>
        </div>
      </form>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <History className="h-3.5 w-3.5" />
        <span>
          Changed something by mistake?{" "}
          <Link href="/admin/history" className="font-semibold text-emerald-700 hover:underline">
            Undo it from Change History
          </Link>
          .
        </span>
      </div>
    </div>
  );
}
