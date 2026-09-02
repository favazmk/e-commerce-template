"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Palette, DollarSign, Truck, ToggleLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/theme/ThemeProvider";

export default function AdminSettingsPage() {
  const { theme, updateThemeColors } = useTheme();

  // General Settings
  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("Artisanal Goods & Timeless Essentials");
  const [email, setEmail] = useState("concierge@auraluxury.com");
  const [phone, setPhone] = useState("+1 (800) 555-0199");
  const [currency, setCurrency] = useState("USD");

  // Branding & Theme Colors
  const [primaryColor, setPrimaryColor] = useState(theme.colors.primary);
  const [secondaryColor, setSecondaryColor] = useState(theme.colors.secondary);
  const [accentColor, setAccentColor] = useState(theme.colors.accent);

  // Tax Settings
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState("8.5");
  const [taxInclusive, setTaxInclusive] = useState(false);

  // Shipping Settings
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("200");
  const [standardRate, setStandardRate] = useState("15");

  // Feature Flags
  const [guestCheckout, setGuestCheckout] = useState(true);
  const [wishlistEnabled, setWishlistEnabled] = useState(true);
  const [reviewsEnabled, setReviewsEnabled] = useState(true);

  const [savedMessage, setSavedMessage] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Update real-time theme CSS tokens immediately
    updateThemeColors({
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor,
    });

    setSavedMessage("Store configuration and brand theme updated!");
    setTimeout(() => setSavedMessage(""), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Agency Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Store & Theme Settings
          </h1>
        </div>
        <Button type="submit" variant="primary" size="md" className="gap-2 shadow-sm">
          <Save className="h-4 w-4" /> Save Settings
        </Button>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-brand bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
          {savedMessage}
        </div>
      )}

      {/* 1. General Info */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-700" /> 1. Store Identity & Contact
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Store Name" required value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          <Input label="Brand Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <Input label="Contact Concierge Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Contact Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      {/* 2. Brand Theme & Colors */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Palette className="h-4 w-4 text-emerald-600" /> 2. Client Theme & Visual Identity
        </h2>
        <p className="text-xs text-slate-500">
          Customizing these tokens updates all buttons, banners, and card borders dynamically.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded-brand border border-slate-300 cursor-pointer p-0.5"
              />
              <span className="font-mono text-xs text-slate-800">{primaryColor}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-14 rounded-brand border border-slate-300 cursor-pointer p-0.5"
              />
              <span className="font-mono text-xs text-slate-800">{secondaryColor}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Accent / CTA Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-14 rounded-brand border border-slate-300 cursor-pointer p-0.5"
              />
              <span className="font-mono text-xs text-slate-800">{accentColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tax & Shipping Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tax */}
        <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-700" /> 3. Tax Configuration
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="taxToggle"
              checked={taxEnabled}
              onChange={(e) => setTaxEnabled(e.target.checked)}
            />
            <label htmlFor="taxToggle" className="text-xs font-semibold text-slate-800">
              Enable Automatic Sales Tax / VAT
            </label>
          </div>
          <Input
            label="Tax Rate (%)"
            type="number"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="inclusiveToggle"
              checked={taxInclusive}
              onChange={(e) => setTaxInclusive(e.target.checked)}
            />
            <label htmlFor="inclusiveToggle" className="text-xs text-slate-600">
              Prices are tax-inclusive (VAT embedded in price)
            </label>
          </div>
        </div>

        {/* Shipping */}
        <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Truck className="h-4 w-4 text-slate-700" /> 4. Shipping Rules
          </h2>
          <Input
            label="Free Express Shipping Threshold ($)"
            type="number"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
          />
          <Input
            label="Standard Ground Flat Rate ($)"
            type="number"
            value={standardRate}
            onChange={(e) => setStandardRate(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Feature Flags */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          5. Store Feature Flags
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
            <input
              type="checkbox"
              checked={guestCheckout}
              onChange={(e) => setGuestCheckout(e.target.checked)}
            />
            Allow Guest Checkout
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
            <input
              type="checkbox"
              checked={wishlistEnabled}
              onChange={(e) => setWishlistEnabled(e.target.checked)}
            />
            Enable Customer Wishlist
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
            <input
              type="checkbox"
              checked={reviewsEnabled}
              onChange={(e) => setReviewsEnabled(e.target.checked)}
            />
            Enable Product Reviews
          </label>
        </div>
      </div>
    </form>
  );
}
