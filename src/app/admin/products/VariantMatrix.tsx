"use client";

import React, { useMemo, useState } from "react";
import { Plus, Trash2, Wand2, X, AlertTriangle, Star } from "lucide-react";
import type { ProductOption, ProductVariant } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Option sets and the variant grid they generate — the Shopify model.
 *
 * The form this replaces could describe one axis at a time: type "Size", type
 * "Small, Medium, Large", get three variants. A product that varies by size AND
 * colour had to be entered as nine hand-written rows, and adding a fourth size
 * later meant remembering which three of the twelve were missing.
 *
 * Here the options are the source of truth and the grid is derived from them.
 * Regenerating is therefore safe and idempotent: a combination that already
 * exists keeps its price, stock, SKU, photo and swatch, a new combination
 * appears with sensible defaults, and a combination whose option value was
 * deleted is removed — but only after saying how many rows that will discard,
 * because those rows hold real stock counts.
 */

/** A variant as edited in the browser: no id until the server assigns one. */
export type DraftVariant = Partial<ProductVariant> & { _key: string };

const MAX_OPTIONS = 3;

/** Option names that should offer a colour picker rather than a plain value. */
const COLOUR_NAMES = ["colour", "color", "shade", "finish"];

const isColourOption = (name: string) => COLOUR_NAMES.includes(name.trim().toLowerCase());

/** Stable identity for a combination, independent of option ordering. */
function signature(attributes: Record<string, string> = {}): string {
  return Object.keys(attributes)
    .sort()
    .map((key) => `${key}=${attributes[key]}`)
    .join("|");
}

/** Every combination of the given option values, in the merchant's own order. */
function cartesian(options: ProductOption[]): Array<Record<string, string>> {
  const usable = options.filter((o) => o.name.trim() && o.values.length > 0);
  if (usable.length === 0) return [];

  return usable.reduce<Array<Record<string, string>>>(
    (combinations, option) =>
      combinations.flatMap((combination) =>
        option.values.map((value) => ({ ...combination, [option.name.trim()]: value }))
      ),
    [{}]
  );
}

function skuSuffix(attributes: Record<string, string>): string {
  return Object.values(attributes)
    .map((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))
    .join("-");
}

export function VariantMatrix({
  options,
  onOptionsChange,
  variants,
  onVariantsChange,
  baseSku,
  basePrice,
  baseStock,
  currency,
}: {
  options: ProductOption[];
  onOptionsChange: (next: ProductOption[]) => void;
  variants: DraftVariant[];
  onVariantsChange: (next: DraftVariant[]) => void;
  baseSku: string;
  basePrice: string;
  baseStock: string;
  currency: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkValue, setBulkValue] = useState("");
  const [pendingValue, setPendingValue] = useState<Record<number, string>>({});

  const combinations = useMemo(() => cartesian(options), [options]);

  /** Combinations that exist in the option sets but have no variant row yet. */
  const missing = useMemo(() => {
    const present = new Set(variants.map((v) => signature(v.attributes as Record<string, string>)));
    return combinations.filter((combination) => !present.has(signature(combination)));
  }, [combinations, variants]);

  /** Variant rows whose combination is no longer described by the options. */
  const orphaned = useMemo(() => {
    if (combinations.length === 0) return [];
    const wanted = new Set(combinations.map(signature));
    return variants.filter((v) => !wanted.has(signature(v.attributes as Record<string, string>)));
  }, [combinations, variants]);

  // ------------------------------------------------------------------ options
  const updateOption = (index: number, patch: Partial<ProductOption>) => {
    onOptionsChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    onOptionsChange([...options, { name: "", values: [], position: options.length }]);
  };

  const removeOption = (index: number) => {
    onOptionsChange(
      options.filter((_, i) => i !== index).map((o, position) => ({ ...o, position }))
    );
  };

  const addValue = (index: number, raw: string) => {
    // One paste of "S, M, L" should become three values, not one.
    const incoming = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (incoming.length === 0) return;

    const existing = options[index].values;
    const merged = [...existing];
    for (const value of incoming) {
      if (!merged.some((v) => v.toLowerCase() === value.toLowerCase())) merged.push(value);
    }

    updateOption(index, { values: merged });
    setPendingValue((prev) => ({ ...prev, [index]: "" }));
  };

  const removeValue = (index: number, value: string) => {
    updateOption(index, { values: options[index].values.filter((v) => v !== value) });
  };

  // ----------------------------------------------------------------- variants
  const generate = () => {
    const price = Number(basePrice) || 0;
    const bySignature = new Map(
      variants.map((v) => [signature(v.attributes as Record<string, string>), v])
    );

    // Spread the product-level stock across brand-new combinations only, so
    // regenerating never redistributes counts that were entered by hand.
    const spread =
      missing.length > 0 ? Math.floor((Number(baseStock) || 0) / missing.length) : 0;

    const next: DraftVariant[] = combinations.map((attributes, index) => {
      const existing = bySignature.get(signature(attributes));
      if (existing) return { ...existing, attributes, position: index };

      return {
        _key: `new-${index}-${Date.now()}`,
        sku: `${baseSku || "SKU"}-${skuSuffix(attributes)}`,
        price,
        stock: spread,
        is_active: true,
        position: index,
        attributes,
      };
    });

    // Exactly one default. Keep the merchant's choice if it survived.
    if (next.length > 0 && !next.some((v) => v.is_default)) {
      next[0] = { ...next[0], is_default: true };
    }

    onVariantsChange(next);
    setSelected(new Set());
  };

  const updateVariant = (key: string, patch: Partial<DraftVariant>) => {
    onVariantsChange(variants.map((v) => (v._key === key ? { ...v, ...patch } : v)));
  };

  const removeVariant = (key: string) => {
    const next = variants.filter((v) => v._key !== key);
    if (next.length > 0 && !next.some((v) => v.is_default)) {
      next[0] = { ...next[0], is_default: true };
    }
    onVariantsChange(next);
  };

  const makeDefault = (key: string) => {
    onVariantsChange(variants.map((v) => ({ ...v, is_default: v._key === key })));
  };

  const toggleSelected = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const applyBulk = (field: "price" | "stock" | "sale_price") => {
    const raw = bulkValue.trim();
    if (!raw) return;

    const targets = selected.size > 0 ? selected : new Set(variants.map((v) => v._key));

    onVariantsChange(
      variants.map((v) => {
        if (!targets.has(v._key)) return v;
        if (field === "sale_price") {
          return { ...v, sale_price: raw ? Number(raw) : null };
        }
        return { ...v, [field]: Number(raw) || 0 };
      })
    );
    setBulkValue("");
  };

  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const allSelected = variants.length > 0 && selected.size === variants.length;

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------------------- options -- */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <div
            key={index}
            className="rounded-brand border border-slate-200 bg-slate-50/60 p-4 space-y-3"
          >
            <div className="flex items-end gap-3">
              <div className="w-56">
                <Input
                  label={`Option ${index + 1}`}
                  value={option.name}
                  placeholder="Size"
                  onChange={(e) => updateOption(index, { name: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="mb-1 rounded-brand p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                title="Remove this option"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {option.values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {isColourOption(option.name) && (
                    <span
                      className="h-3 w-3 rounded-full border border-slate-300"
                      style={{ background: value }}
                      aria-hidden
                    />
                  )}
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValue(index, value)}
                    className="text-slate-400 hover:text-rose-600"
                    aria-label={`Remove ${value}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <input
                value={pendingValue[index] ?? ""}
                onChange={(e) => setPendingValue((prev) => ({ ...prev, [index]: e.target.value }))}
                onKeyDown={(e) => {
                  // Enter and comma both commit, because both are what people
                  // actually type when listing sizes.
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addValue(index, pendingValue[index] ?? "");
                  }
                  if (e.key === "Backspace" && !(pendingValue[index] ?? "") && option.values.length) {
                    removeValue(index, option.values[option.values.length - 1]);
                  }
                }}
                onBlur={() => addValue(index, pendingValue[index] ?? "")}
                placeholder={
                  option.values.length === 0 ? "Small, Medium, Large — then Enter" : "Add another"
                }
                className="min-w-[12rem] flex-1 rounded-brand border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            disabled={options.length >= MAX_OPTIONS}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {options.length === 0 ? "Add an option like Size or Colour" : "Add another option"}
          </Button>

          {options.length >= MAX_OPTIONS && (
            <span className="text-[11px] text-slate-500">
              Three options is the maximum — past that the grid stops being maintainable by hand.
            </span>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------- regenerate -- */}
      {combinations.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-brand border border-emerald-200 bg-emerald-50/70 p-3">
          <Wand2 className="h-4 w-4 text-emerald-700 shrink-0" />
          <p className="flex-1 text-xs text-emerald-900">
            <strong>{combinations.length}</strong>{" "}
            {combinations.length === 1 ? "combination" : "combinations"} from these options.
            {missing.length > 0 && ` ${missing.length} not yet in the grid.`}
            {orphaned.length > 0 && (
              <span className="font-semibold">
                {" "}
                {orphaned.length} existing {orphaned.length === 1 ? "row" : "rows"} no longer match
                and will be removed.
              </span>
            )}
          </p>
          <Button type="button" variant="primary" size="sm" onClick={generate}>
            {variants.length === 0 ? "Generate variants" : "Update grid"}
          </Button>
        </div>
      )}

      {orphaned.length > 0 && (
        <p className="flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Updating the grid discards {orphaned.length} row
          {orphaned.length === 1 ? "" : "s"} along with the stock recorded against{" "}
          {orphaned.length === 1 ? "it" : "them"}. Add the option value back first if that was not
          intended.
        </p>
      )}

      {/* ---------------------------------------------------------- grid ----- */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-brand border border-slate-200 bg-white p-2.5">
            <span className="text-xs font-semibold text-slate-600">
              {selected.size > 0 ? `${selected.size} selected` : `Apply to all ${variants.length}`}
            </span>
            <input
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder="Value"
              inputMode="decimal"
              className="w-24 rounded-brand border border-slate-300 px-2 py-1.5 text-xs focus:border-brand-primary focus:outline-none"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => applyBulk("price")}>
              Set price
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyBulk("sale_price")}>
              Set sale price
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyBulk("stock")}>
              Set stock
            </Button>
            <span className="ml-auto text-xs text-slate-500">
              Total stock <strong className="text-slate-800">{totalStock}</strong>
            </span>
          </div>

          <div className="overflow-x-auto rounded-brand border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        setSelected(allSelected ? new Set() : new Set(variants.map((v) => v._key)))
                      }
                      aria-label="Select all variants"
                    />
                  </th>
                  <th className="p-2.5">Variant</th>
                  <th className="p-2.5">SKU</th>
                  <th className="p-2.5">Price ({currency})</th>
                  <th className="p-2.5">Sale</th>
                  <th className="p-2.5">Stock</th>
                  <th className="p-2.5">Barcode</th>
                  <th className="p-2.5 text-center">Shown on card</th>
                  <th className="p-2.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {variants.map((variant) => {
                  const attributes = (variant.attributes || {}) as Record<string, string>;
                  const colourKey = Object.keys(attributes).find(isColourOption);

                  return (
                    <tr key={variant._key} className={variant.is_active === false ? "opacity-50" : ""}>
                      <td className="p-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(variant._key)}
                          onChange={() => toggleSelected(variant._key)}
                          aria-label={`Select ${Object.values(attributes).join(" ")}`}
                        />
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          {colourKey && (
                            <input
                              type="color"
                              value={variant.swatch_hex || "#000000"}
                              onChange={(e) =>
                                updateVariant(variant._key, { swatch_hex: e.target.value })
                              }
                              className="h-6 w-6 cursor-pointer rounded border border-slate-300 bg-white p-0"
                              title="Swatch colour shown on the product card"
                            />
                          )}
                          <span className="font-semibold text-slate-800">
                            {Object.values(attributes).join(" / ") || "Default"}
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <input
                          value={variant.sku || ""}
                          onChange={(e) => updateVariant(variant._key, { sku: e.target.value })}
                          className="w-32 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          value={variant.price ?? ""}
                          inputMode="decimal"
                          onChange={(e) =>
                            updateVariant(variant._key, { price: Number(e.target.value) })
                          }
                          className="w-24 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          value={variant.sale_price ?? ""}
                          inputMode="decimal"
                          placeholder="—"
                          onChange={(e) =>
                            updateVariant(variant._key, {
                              sale_price: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          className="w-24 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          value={variant.stock ?? 0}
                          inputMode="numeric"
                          onChange={(e) =>
                            updateVariant(variant._key, { stock: Number(e.target.value) })
                          }
                          className="w-20 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          value={variant.barcode || ""}
                          placeholder="GTIN"
                          onChange={(e) => updateVariant(variant._key, { barcode: e.target.value })}
                          className="w-32 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => makeDefault(variant._key)}
                          title="Preview this variant on the product card"
                          className={
                            variant.is_default ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
                          }
                        >
                          <Star
                            className="h-4 w-4"
                            fill={variant.is_default ? "currentColor" : "none"}
                          />
                        </button>
                      </td>
                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() => removeVariant(variant._key)}
                          className="text-slate-400 hover:text-rose-600"
                          aria-label="Remove variant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-500">
            Stock is tracked per variant; the product total above is their sum. Leave the sale column
            empty for variants that should stay at full price during a sale.
          </p>
        </div>
      )}
    </div>
  );
}
