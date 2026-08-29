"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Archive,
  ShoppingCart,
  Tag,
  Settings,
  Sliders,
  Image as ImageIcon,
  ExternalLink,
  Menu,
  X,
  Store,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Layers },
    { name: "Inventory", href: "/admin/inventory", icon: Archive },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
    { name: "Homepage Builder", href: "/admin/homepage", icon: Sliders },
    { name: "Media Library", href: "/admin/media", icon: ImageIcon },
    { name: "Store Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-body text-slate-800">
      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold font-heading text-lg">
          <Store className="h-5 w-5 text-emerald-400" />
          <span>AURA ADMIN</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 text-slate-300 hover:text-white"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
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
              <h2 className="text-xl font-bold font-heading text-white">Aura Luxury</h2>
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
                      ? "bg-emerald-600 text-white shadow-xs"
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

        {/* User Info / Storefront Link */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-white">Administrator</p>
              <p className="text-[10px] text-slate-400">admin@store.com</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-[11px] text-emerald-400 hover:underline font-semibold"
          >
            Store ↗
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
