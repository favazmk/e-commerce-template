"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/theme/ThemeProvider";
import {
  LayoutDashboard,
  Package,
  Layers,
  Archive,
  ShoppingCart,
  Tag,
  MessageSquare,
  Settings,
  History,
  Sliders,
  Image as ImageIcon,
  ExternalLink,
  Menu,
  X,
  Store,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close on navigation and on Escape, so the overlay can never trap the user.
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSidebarOpen]);

  const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Layers },
    { name: "Inventory", href: "/admin/inventory", icon: Archive },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
    { name: "Reviews", href: "/admin/reviews", icon: MessageSquare },
    { name: "Homepage Builder", href: "/admin/homepage", icon: Sliders },
    { name: "Media Library", href: "/admin/media", icon: ImageIcon },
    { name: "Shipping & Features", href: "/admin/settings", icon: Settings },
    { name: "Change History", href: "/admin/history", icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-body text-slate-800">
      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold font-heading text-lg">
          <Store className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span className="truncate">{theme.brand.name}</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 text-slate-300 hover:text-white flex-shrink-0"
          aria-label="Toggle admin navigation"
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile scrim */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 overflow-y-auto bg-slate-900 text-slate-300 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo & Store Info */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 block">
                Store Admin
              </span>
              <h2 className="text-xl font-bold font-heading text-white truncate">
                {theme.brand.name}
              </h2>
            </div>
            <Link
              href="/"
              target="_blank"
              className="p-1.5 rounded-brand bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Open Live Storefront"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="px-3 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-brand text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Storefront Link */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
            Admin
          </span>
          <Link
            href="/"
            className="text-[11px] text-emerald-400 hover:underline font-semibold"
          >
            View store &#8599;
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10">{children}</main>
      </div>
    </div>
  );
}
