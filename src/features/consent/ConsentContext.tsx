"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Cookie / tracking consent state.
 *
 * Why this exists at all: Google Consent Mode v2 has been mandatory since March
 * 2024 for anyone serving EEA/UK traffic through Google Ads or GA4 — without a
 * consent signal, Google stops collecting and remarketing audiences quietly go
 * empty. UAE PDPL and most other modern privacy laws want the same thing.
 *
 * The design principle: analytics and advertising storage start DENIED and are
 * only granted after an explicit action. "Denied by default" is the difference
 * between a compliant banner and decorative one.
 */

export interface ConsentState {
  /** Strictly necessary — cart, session, security. Cannot be switched off. */
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentContextValue {
  consent: ConsentState;
  /** True until a stored decision has been read; the banner waits for this. */
  isLoading: boolean;
  /** True when the visitor has never made a choice. */
  needsDecision: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (choice: { analytics: boolean; marketing: boolean }) => void;
  /** Re-open the banner, e.g. from a "Cookie settings" footer link. */
  reopen: () => void;
}

const STORAGE_KEY = "cookie_consent_v1";
/** Re-ask after this long, as most guidance expects consent to be refreshed. */
const CONSENT_TTL_DAYS = 180;

const DEFAULT_CONSENT: ConsentState = { necessary: true, analytics: false, marketing: false };

const ConsentContext = createContext<ConsentContextValue | null>(null);

interface StoredConsent {
  analytics: boolean;
  marketing: boolean;
  decidedAt: number;
}

function readStored(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (typeof parsed?.decidedAt !== "number") return null;

    const ageDays = (Date.now() - parsed.decidedAt) / (1000 * 60 * 60 * 24);
    if (ageDays > CONSENT_TTL_DAYS) return null;

    return {
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      decidedAt: parsed.decidedAt,
    };
  } catch {
    return null;
  }
}

/** Push the decision into Google's consent API. */
function updateGoogleConsent(analytics: boolean, marketing: boolean): void {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };

  // gtag may not exist yet — the tag script loads afterInteractive. Pushing to
  // dataLayer directly is the documented fallback and is replayed on load.
  const payload = {
    ad_storage: marketing ? "granted" : "denied",
    ad_user_data: marketing ? "granted" : "denied",
    ad_personalization: marketing ? "granted" : "denied",
    analytics_storage: analytics ? "granted" : "denied",
  };

  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", payload);
  } else {
    w.dataLayer = w.dataLayer || [];
    // gtag() pushes its raw `arguments` object, so the array form is equivalent.
    w.dataLayer.push(["consent", "update", payload]);
  }

  // Meta Pixel honours a separate switch.
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("consent", marketing ? "grant" : "revoke");
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [isLoading, setIsLoading] = useState(true);
  const [needsDecision, setNeedsDecision] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setConsent({ necessary: true, analytics: stored.analytics, marketing: stored.marketing });
      updateGoogleConsent(stored.analytics, stored.marketing);
    } else {
      setNeedsDecision(true);
    }
    setIsLoading(false);
  }, []);

  const persist = useCallback((analytics: boolean, marketing: boolean) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ analytics, marketing, decidedAt: Date.now() })
      );
    } catch {
      // Storage blocked. The choice still applies to this page view; the
      // banner simply reappears next visit, which is the safe direction.
    }
    setConsent({ necessary: true, analytics, marketing });
    setNeedsDecision(false);
    updateGoogleConsent(analytics, marketing);
  }, []);

  const value: ConsentContextValue = {
    consent,
    isLoading,
    needsDecision,
    acceptAll: () => persist(true, true),
    rejectAll: () => persist(false, false),
    save: ({ analytics, marketing }) => persist(analytics, marketing),
    reopen: () => setNeedsDecision(true),
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    // A component outside the provider must not crash the storefront; it just
    // behaves as though nothing is consented, which is the safe default.
    return {
      consent: DEFAULT_CONSENT,
      isLoading: false,
      needsDecision: false,
      acceptAll: () => {},
      rejectAll: () => {},
      save: () => {},
      reopen: () => {},
    };
  }
  return context;
}
