"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { useConsent } from "@/features/consent/ConsentContext";
import { Button } from "@/components/ui/button";

/**
 * Cookie consent banner.
 *
 * Deliberately not a dark pattern: "Reject all" is as prominent and as easy to
 * reach as "Accept all". Regulators (and, since 2024, Google's own Consent Mode
 * certification) treat a buried reject option as no consent at all — so the
 * fair layout is also the one that keeps the ad account working.
 *
 * Renders nothing when no measurement tag is configured. A store with no
 * tracking has nothing to ask permission for, and a banner there would be
 * theatre.
 */
export function CookieConsent() {
  const { needsDecision, isLoading, acceptAll, rejectAll, save } = useConsent();
  const [showDetail, setShowDetail] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const trackingConfigured = Boolean(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
      process.env.NEXT_PUBLIC_GTM_ID ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID
  );

  if (!trackingConfigured || isLoading || !needsDecision) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-white/98 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex min-w-0 flex-1 gap-3">
            <Cookie className="mt-0.5 hidden h-5 w-5 flex-shrink-0 text-brand-faint-ink sm:block" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-brand-ink">We use cookies</h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted-ink">
                Some are needed to run the store — your bag and your sign-in will not work without
                them. Others help us understand what is useful and show you relevant ads. You choose.{" "}
                <Link href="/privacy-policy" className="underline hover:text-brand-ink">
                  Privacy policy
                </Link>
              </p>

              {showDetail && (
                <fieldset className="mt-4 space-y-2.5 rounded-brand border border-brand-border bg-brand-subtle p-3">
                  <legend className="sr-only">Cookie categories</legend>

                  <label className="flex items-start gap-2.5 text-xs">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="mt-0.5 h-4 w-4 rounded border-brand-border-strong text-brand-faint-ink"
                    />
                    <span>
                      <span className="font-semibold text-brand-ink">Strictly necessary</span>
                      <span className="block text-brand-muted-ink">
                        Shopping bag, sign-in session, fraud prevention. Always on.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(event) => setAnalytics(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-brand-border-strong text-brand-primary focus:ring-brand-primary"
                    />
                    <span>
                      <span className="font-semibold text-brand-ink">Analytics</span>
                      <span className="block text-brand-muted-ink">
                        Which pages are used and where checkout goes wrong. Aggregated.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(event) => setMarketing(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-brand-border-strong text-brand-primary focus:ring-brand-primary"
                    />
                    <span>
                      <span className="font-semibold text-brand-ink">Advertising</span>
                      <span className="block text-brand-muted-ink">
                        Lets us measure ads and show you products you looked at.
                      </span>
                    </span>
                  </label>
                </fieldset>
              )}
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
            {showDetail ? (
              <Button size="sm" onClick={() => save({ analytics, marketing })} className="flex-1">
                Save choices
              </Button>
            ) : (
              <Button size="sm" onClick={acceptAll} className="flex-1 lg:min-w-[10rem]">
                Accept all
              </Button>
            )}
            {/* Same size, same weight, same row as Accept — a reject button
                hidden behind a link is not a real choice. */}
            <Button size="sm" variant="outline" onClick={rejectAll} className="flex-1">
              Reject all
            </Button>
            {!showDetail && (
              <Button size="sm" variant="ghost" onClick={() => setShowDetail(true)} className="flex-1">
                Customise
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
