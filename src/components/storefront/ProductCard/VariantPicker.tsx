"use client";

import React from "react";
import type { ColourSwatch, SizeOption } from "@/lib/commerce/merchandising";

/**
 * In-grid variant selection.
 *
 * The problem this solves: on a fashion grid, the commonest reason to open a
 * product page is to find out whether it comes in your size or the colour you
 * want — and the commonest reason to bounce straight back is that it does not.
 * Every one of those round trips is a chance to lose the visit.
 *
 * Showing the options on the card answers the question before the click, which
 * is why every large marketplace does it. Sizes that are out of stock are shown
 * struck through rather than hidden, so the shopper can see the full range and
 * understand what is missing instead of wondering.
 */

export interface SizePickerProps {
  sizes: SizeOption[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  /** Cap before collapsing into "+N". Grids get noisy past five. */
  max?: number;
}

export function SizePicker({ sizes, selectedVariantId, onSelect, max = 5 }: SizePickerProps) {
  if (sizes.length === 0) return null;

  const visible = sizes.slice(0, max);
  const overflow = sizes.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Available sizes">
      {visible.map((size) => {
        const selected = selectedVariantId === size.variantId;

        return (
          <button
            key={size.variantId}
            type="button"
            onClick={(event) => {
              // The card is wrapped in a link to the product page.
              event.preventDefault();
              event.stopPropagation();
              if (size.inStock) onSelect(size.variantId);
            }}
            disabled={!size.inStock}
            aria-pressed={selected}
            aria-label={
              size.inStock ? `Select size ${size.label}` : `Size ${size.label} is out of stock`
            }
            className={`min-w-[26px] rounded-brand-sm border px-1.5 py-0.5 text-[11px] font-semibold leading-tight transition-colors ${
              selected
                ? "border-brand-primary bg-brand-primary text-white"
                : size.inStock
                  ? "border-brand-border-strong bg-white text-brand-ink hover:border-brand-ink"
                  : "cursor-not-allowed border-brand-border bg-brand-subtle text-brand-faint-ink line-through"
            }`}
          >
            {size.label}
          </button>
        );
      })}

      {overflow > 0 && (
        <span className="text-[11px] font-medium text-brand-faint-ink">+{overflow}</span>
      )}
    </div>
  );
}

export interface ColourPickerProps {
  swatches: ColourSwatch[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  max?: number;
}

export function ColourPicker({
  swatches,
  selectedVariantId,
  onSelect,
  max = 4,
}: ColourPickerProps) {
  if (swatches.length === 0) return null;

  const visible = swatches.slice(0, max);
  const overflow = swatches.length - visible.length;

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Available colours">
      {visible.map((swatch) => {
        const selected = selectedVariantId === swatch.variantId;

        return (
          <button
            key={swatch.variantId}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (swatch.inStock) onSelect(swatch.variantId);
            }}
            disabled={!swatch.inStock}
            aria-pressed={selected}
            aria-label={
              swatch.inStock ? `Select colour ${swatch.label}` : `${swatch.label} is out of stock`
            }
            title={swatch.label}
            className={`relative h-4 w-4 flex-shrink-0 rounded-full border transition-transform ${
              selected
                ? "border-brand-ink ring-2 ring-brand-ink ring-offset-1"
                : "border-brand-border-strong hover:scale-110"
            } ${swatch.inStock ? "" : "opacity-40"}`}
            style={
              swatch.hex
                ? { backgroundColor: swatch.hex }
                : swatch.imageUrl
                  ? {
                      // No known hex: preview the variant photograph rather than
                      // guessing a colour. A wrong swatch is worse than none.
                      backgroundImage: `url(${swatch.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : { backgroundColor: "var(--brand-subtle)" }
            }
          >
            {!swatch.inStock && (
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[1px] w-[130%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-brand-faint-ink"
              />
            )}
          </button>
        );
      })}

      {overflow > 0 && (
        <span className="text-[11px] font-medium text-brand-faint-ink">+{overflow} more</span>
      )}
    </div>
  );
}
