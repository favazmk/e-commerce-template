"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, MapPin, Package, ShieldCheck, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/account", label: "Overview", icon: UserIcon, exact: true },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
  { href: "/account/security", label: "Login & security", icon: ShieldCheck },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full navigation so every Server Component re-renders without the session.
    window.location.href = "/";
  };

  return (
    <nav aria-label="Account sections" className="lg:sticky lg:top-28">
      {/* Horizontal scroller on phones, vertical list from lg up. */}
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="flex-shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-brand px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-ink text-white shadow-sm"
                    : "text-brand-muted-ink hover:bg-brand-subtle hover:text-brand-ink"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </li>
          );
        })}
        <li className="flex-shrink-0">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-brand px-4 py-2.5 text-sm font-medium text-brand-muted-ink transition-colors hover:bg-brand-danger-surface hover:text-brand-danger"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
