"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";
import type { Product } from "@/types/database";

/**
 * Curated "you may also like" and "upgrade to" products — WooCommerce's
 * cross-sells and upsells.
 *
 * The recommendation engine already derives these from real co-purchase data,
 * which is better than anything a merchant can guess. But a new store has no
 * order history, so on day one every recommendation slot is empty. That is the
 * cold-start problem this solves: the merchant's picks are the fallback until
 * the data arrives, and are then quietly outranked by it.
 */

export type RelationType = "similar" | "upsell" | "bundle";

export interface DraftRelation {
  related_product_id: string;
  relation_type: RelationType;
  display_order: number;
  /** Cached for display; never sent to the server. */
  label?: string;
  image?: string | null;
}

const RELATION_LABELS: Record<RelationType, { title: string; help: string }> = {
  similar: {
    title: "You may also like",
    help: "Alternatives shown on the product page when it is not quite right.",
  },
  upsell: {
    title: "Upgrade to",
    help: "A premium version, shown to a shopper already interested in this one.",
  },
  bundle: {
    title: "Frequently bought together",
    help: "Goes-with items, offered as a bundle in the cart.",
  },
};

export function RelatedProductsPicker({
  productId,
  relations,
  onChange,
}: {
  productId?: string;
  relations: DraftRelation[];
  onChange: (next: DraftRelation[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeType, setActiveType] = useState<RelationType>("similar");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    // Debounced: a picker that fires a request per keystroke turns a four-letter
    // search into four round trips and a flickering list.
    debounce.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/products?searchQuery=${encodeURIComponent(query.trim())}&limit=8`
        );
        const data = await res.json();
        setResults(data?.data?.items || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  const add = (product: Product) => {
    // Relating a product to itself renders a loop on the product page, and the
    // database rejects it — catch it here where it can be explained.
    if (product.id === productId) return;
    if (
      relations.some(
        (r) => r.related_product_id === product.id && r.relation_type === activeType
      )
    ) {
      return;
    }

    onChange([
      ...relations,
      {
        related_product_id: product.id,
        relation_type: activeType,
        display_order: relations.filter((r) => r.relation_type === activeType).length,
        label: product.name,
        image: product.images?.[0]?.url ?? null,
      },
    ]);
    setQuery("");
    setResults([]);
  };

  const remove = (id: string, type: RelationType) => {
    onChange(
      relations.filter((r) => !(r.related_product_id === id && r.relation_type === type))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(RELATION_LABELS) as RelationType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeType === type
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {RELATION_LABELS[type].title}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-500">{RELATION_LABELS[activeType].help}</p>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the catalogue by name…"
          className="w-full rounded-brand border border-slate-300 py-2.5 pl-9 pr-9 text-xs focus:border-brand-primary focus:outline-none"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}

        {results.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-brand border border-slate-200 bg-white shadow-lg">
            {results.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => add(product)}
                  disabled={product.id === productId}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs hover:bg-slate-50 disabled:opacity-40"
                >
                  {product.images?.[0]?.url ? (
                    <Image
                      src={product.images[0].url}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <span className="h-8 w-8 rounded bg-slate-100" />
                  )}
                  <span className="flex-1 font-semibold text-slate-800">{product.name}</span>
                  <span className="text-slate-400">{product.sku}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(Object.keys(RELATION_LABELS) as RelationType[]).map((type) => {
        const picked = relations.filter((r) => r.relation_type === type);
        if (picked.length === 0) return null;

        return (
          <div key={type} className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {RELATION_LABELS[type].title}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {picked.map((relation) => (
                <li
                  key={`${type}-${relation.related_product_id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {relation.label || relation.related_product_id.slice(0, 8)}
                  <button
                    type="button"
                    onClick={() => remove(relation.related_product_id, type)}
                    className="text-slate-400 hover:text-rose-600"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
