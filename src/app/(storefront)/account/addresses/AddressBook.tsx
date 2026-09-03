"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Address } from "@/types/database";

export interface AddressBookProps {
  initialAddresses: Address[];
}

type FormState = {
  type: "shipping" | "billing";
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
};

const EMPTY_FORM: FormState = {
  type: "shipping",
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "",
  phone: "",
  is_default: false,
};

function toForm(address: Address): FormState {
  return {
    type: address.type,
    first_name: address.first_name,
    last_name: address.last_name,
    company: address.company || "",
    address_1: address.address_1,
    address_2: address.address_2 || "",
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
    country: address.country,
    phone: address.phone,
    is_default: address.is_default,
  };
}

export function AddressBook({ initialAddresses }: AddressBookProps) {
  const router = useRouter();

  const [addresses, setAddresses] = useState(initialAddresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(initialAddresses.length === 0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value })),
    error: fieldErrors[key]?.[0],
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsCreating(false);
    setFieldErrors({});
    setError("");
  };

  /** Reload from the server rather than trusting local state after a write. */
  const refresh = async () => {
    const response = await fetch("/api/account/addresses");
    const payload = await response.json();
    if (payload.success) setAddresses(payload.data);
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await fetch(
        editingId ? `/api/account/addresses/${editingId}` : "/api/account/addresses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        if (payload?.error?.fields) setFieldErrors(payload.error.fields);
        setError(payload?.error?.message || "Could not save that address.");
        return;
      }

      await refresh();
      resetForm();
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // A saved address is trivially re-enterable, so a modal here is friction
    // for its own sake — but an accidental tap should still be deliberate.
    if (!window.confirm("Remove this address from your address book?")) return;

    const response = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    if (response.ok) await refresh();
  };

  const handleSetDefault = async (id: string) => {
    const response = await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_default" }),
    });
    if (response.ok) await refresh();
  };

  const showForm = isCreating || editingId !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-slate-900">Saved addresses</h1>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => {
              setForm(EMPTY_FORM);
              setIsCreating(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add address
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-brand-xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-slate-900">
              {editingId ? "Edit address" : "New address"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-brand bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" autoComplete="given-name" required {...field("first_name")} />
            <Input label="Last name" autoComplete="family-name" required {...field("last_name")} />
          </div>

          <Input
            label="Address line 1"
            autoComplete="address-line1"
            placeholder="Building, street"
            required
            {...field("address_1")}
          />
          <Input
            label="Address line 2 (optional)"
            autoComplete="address-line2"
            placeholder="Apartment, floor, landmark"
            {...field("address_2")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="City" autoComplete="address-level2" required {...field("city")} />
            <Input
              label="State / Emirate"
              autoComplete="address-level1"
              required
              {...field("state")}
            />
            <Input label="Postal code" autoComplete="postal-code" {...field("postal_code")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Country" autoComplete="country-name" required {...field("country")} />
            <Input
              label="Phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="For delivery updates"
              required
              {...field("phone")}
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_default: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Use this as my default delivery address
          </label>

          <div className="flex gap-3">
            <Button type="submit" isLoading={saving}>
              <Check className="h-4 w-4" /> {editingId ? "Save changes" : "Save address"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="rounded-brand-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">No saved addresses</h2>
          <p className="mt-1 text-xs text-slate-500">
            Save one now and checkout becomes a single tap next time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative rounded-brand-xl border bg-white p-5 shadow-subtle transition-colors ${
                address.is_default ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
              }`}
            >
              {address.is_default && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <Star className="h-3 w-3 fill-current" /> Default
                </span>
              )}

              <address className="space-y-0.5 pr-20 text-xs not-italic leading-relaxed text-slate-600">
                <p className="text-sm font-semibold text-slate-900">
                  {address.first_name} {address.last_name}
                </p>
                {address.company && <p>{address.company}</p>}
                <p>{address.address_1}</p>
                {address.address_2 && <p>{address.address_2}</p>}
                <p>
                  {address.city}
                  {address.state ? `, ${address.state}` : ""} {address.postal_code}
                </p>
                <p>{address.country}</p>
                <p className="pt-1 text-slate-500">{address.phone}</p>
              </address>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setForm(toForm(address));
                    setEditingId(address.id);
                    setIsCreating(false);
                  }}
                  className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    className="flex items-center gap-1 font-semibold text-slate-600 hover:text-emerald-600"
                  >
                    <Star className="h-3.5 w-3.5" /> Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  className="ml-auto flex items-center gap-1 font-semibold text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
