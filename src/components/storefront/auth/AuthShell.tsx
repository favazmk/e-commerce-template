import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Headset } from "lucide-react";

export interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Rendered under the card, e.g. "Already have an account? Sign in". */
  footer?: React.ReactNode;
}

/**
 * Shared frame for the sign-in, sign-up and password-recovery screens.
 *
 * The reassurance column is not decoration: the account screens are where the
 * highest share of shoppers abandon, and restating the guarantees they already
 * saw on the product page measurably reduces that drop-off. The content is
 * generic commerce copy, so it stays valid for every client store.
 */
export function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  const assurances = [
    { icon: ShieldCheck, label: "Secure checkout", detail: "Encrypted payments, never stored on our servers" },
    { icon: Truck, label: "Order tracking", detail: "Follow every order from packing to your door" },
    { icon: RotateCcw, label: "Easy returns", detail: "Start a return from your account in a few taps" },
    { icon: Headset, label: "Real support", detail: "Talk to a person when something is not right" },
  ];

  return (
    <div className="min-h-[70vh] bg-brand-subtle/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:py-20">
        {/* Form column */}
        <div className="lg:col-span-7">
          <div className="mx-auto w-full max-w-md">
            {eyebrow && (
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-primary">
                {eyebrow}
              </span>
            )}
            <h1 className="mt-2 font-heading text-3xl font-bold text-brand-ink sm:text-4xl">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-sm text-brand-muted-ink">{subtitle}</p>}

            <div className="mt-8 rounded-brand-xl border border-brand-border bg-white p-6 shadow-subtle sm:p-8">
              {children}
            </div>

            {footer && <div className="mt-6 text-center text-sm text-brand-muted-ink">{footer}</div>}

            <p className="mt-8 text-center text-[11px] leading-relaxed text-brand-faint-ink">
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline hover:text-brand-muted-ink">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="underline hover:text-brand-muted-ink">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Reassurance column — hidden on phones where it would push the form down */}
        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-28 rounded-brand-xl border border-brand-border bg-white p-8 shadow-subtle">
            <h2 className="font-heading text-lg font-bold text-brand-ink">
              Why shoppers create an account
            </h2>
            <ul className="mt-6 space-y-6">
              {assurances.map((item) => (
                <li key={item.label} className="flex gap-4">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-success/10 text-brand-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-brand-muted-ink">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
