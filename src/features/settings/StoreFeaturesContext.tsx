"use client";

import React, { createContext, useContext } from "react";

/**
 * Which optional storefront features are switched on.
 *
 * The values are read once on the server (in the storefront layout) and handed
 * down, so client components can gate their UI without each one fetching.
 */
export interface StoreFeatures {
  guestCheckout: boolean;
  wishlist: boolean;
  reviews: boolean;
}

/**
 * Defaults are permissive on purpose. A settings row that is missing or fails
 * to load should leave the shop working exactly as it does today, not silently
 * switch features off for every customer.
 */
export const DEFAULT_STORE_FEATURES: StoreFeatures = {
  guestCheckout: true,
  wishlist: true,
  reviews: false,
};

const StoreFeaturesContext = createContext<StoreFeatures>(DEFAULT_STORE_FEATURES);

export function StoreFeaturesProvider({
  features,
  children,
}: {
  features: StoreFeatures;
  children: React.ReactNode;
}) {
  return (
    <StoreFeaturesContext.Provider value={features}>{children}</StoreFeaturesContext.Provider>
  );
}

export function useStoreFeatures(): StoreFeatures {
  return useContext(StoreFeaturesContext);
}
