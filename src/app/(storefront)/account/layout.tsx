import React from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { AccountNav } from "./AccountNav";

// The account area is per-customer by definition and must never be cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My account",
  // Account pages must stay out of search results even if a URL leaks.
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Identity comes from the session cookie only. The middleware also guards
  // /account, but a layout that assumed that would break the moment the
  // matcher changed — so the check is repeated where the data is read.
  const user = await getSessionUser();
  if (!user) redirect("/login?redirectTo=/account");

  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  const initials = (user.name || user.email || "?")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Identity banner */}
      <div className="mb-8 flex flex-col items-center gap-5 rounded-brand-xl bg-brand-ink p-6 text-white shadow-float sm:flex-row sm:p-8">
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-primary bg-brand-ink">
          {user.avatar_url ? (
            <Image fill sizes="64px" src={user.avatar_url} alt="" className="object-cover" />
          ) : (
            <span className="text-lg font-bold text-brand-primary">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-primary">
            My account
          </span>
          <h1 className="mt-1 break-words font-heading text-2xl font-bold sm:text-3xl">
            {user.name || "Welcome back"}
          </h1>
          <p className="mt-1 break-all text-xs text-brand-faint-ink">
            {user.email} &bull; Member since {memberSince}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-3">
          <AccountNav />
        </div>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
