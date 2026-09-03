"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Recently viewed products, stored in the visitor's own browser.
 *
 * Deliberately not a database table. Browsing history is personal data: keeping
 * it server-side would mean a retention policy, a deletion path, a consent
 * basis under UAE PDPL / GDPR, and one more thing to leak in a breach. In
 * localStorage it gives the same "pick up where you left off" strip, costs no
 * requests, and disappears when the visitor clears their browser — which is
 * exactly the control a privacy regulator wants them to have.
 */

const STORAGE_KEY = "recently_viewed_v1";
const MAX_ENTRIES = 12;

/** Product ids are UUIDs; anything else in storage is stale or tampered with. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id) => typeof id === "string" && UUID_PATTERN.test(id))
      .slice(0, MAX_ENTRIES);
  } catch {
    // Private browsing, disabled storage, or corrupt JSON. Never throw here —
    // a storage problem must not take down the product page.
    return [];
  }
}

function write(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)));
  } catch {
    /* Storage unavailable or full; the feature simply does not persist. */
  }
}

export function useRecentlyViewed() {
  const [productIds, setProductIds] = useState<string[]>([]);

  // Read after mount only: localStorage does not exist during SSR, and reading
  // it during render would produce a hydration mismatch.
  useEffect(() => {
    setProductIds(read());
  }, []);

  /** Record a view, moving the product to the front of the list. */
  const record = useCallback((productId: string) => {
    if (!UUID_PATTERN.test(productId)) return;
    const next = [productId, ...read().filter((id) => id !== productId)].slice(0, MAX_ENTRIES);
    write(next);
    setProductIds(next);
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to do */
    }
    setProductIds([]);
  }, []);

  return { productIds, record, clear };
}
