"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProductImage } from "../ProductImage";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { Product } from "@/types/database";

export function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?searchQuery=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        if (data.success && data.data?.items) {
          setResults(data.data.items);
        }
      } catch (err) {
        console.error("Live search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 md:p-20 animate-in fade-in duration-200">
      <div className="mx-auto max-w-2xl transform overflow-hidden rounded-brand-xl bg-white shadow-2xl transition-all border border-slate-100">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search overcoats, boots, leather bags, ceramics, watches..."
            className="h-16 w-full border-0 bg-transparent pl-4 pr-10 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
            autoFocus
          />
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
              <span className="text-xs uppercase font-semibold">ESC</span>
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4">
          {query && results.length > 0 ? (
            <div className="space-y-2">
              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Products ({results.length})
              </p>
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 rounded-brand p-2.5 transition-colors hover:bg-slate-50 group"
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-brand bg-slate-100">
                    <ProductImage
                      src={product.images?.[0]?.url}
                      seed={product.name}
                      alt=""
                      sizes="56px"
                      compact
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-brand-primary">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">{product.brand || ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">${product.price.toFixed(2)}</p>
                    <span className="text-[11px] text-emerald-600 flex items-center justify-end gap-1">
                      View <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : query && !isLoading ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-900">No products found for &quot;{query}&quot;</p>
              <p className="mt-1 text-xs text-slate-500">
                Try searching for cashmere, boots, bag, watch, or denim.
              </p>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Trending Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {["Cashmere Overcoat", "Chelsea Boots", "Merino Knit", "Leather Tote", "Watch"].map(
                  (term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
