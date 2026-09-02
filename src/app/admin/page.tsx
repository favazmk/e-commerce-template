import React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Plus,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { OrderService } from "@/services/order.service";
import { ProductService } from "@/services/product.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/config/store.config";

export default async function AdminDashboardPage() {
  const orders = await OrderService.getAllAdminOrders();
  const products = await ProductService.getAllAdminProducts();

  // Metrics Calculation
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.total_amount : 0), 0);
  const totalOrdersCount = orders.length;
  const aov = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.low_stock_threshold);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Store Performance
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Merchant Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products/new">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> Add New Product
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              View All Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-heading">
              {formatPrice(totalRevenue)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +14.2% this month
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Orders */}
        <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Orders Placed
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-heading">
              {totalOrdersCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Live synchronized</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6" />
          </div>
        </div>

        {/* Average Order Value */}
        <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Order Value
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-heading">
              {formatPrice(aov)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Per transaction</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low Stock Alerts
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1 font-heading">
              {lowStockProducts.length} items
            </p>
            <Link
              href="/admin/inventory"
              className="text-[11px] text-amber-700 font-medium hover:underline flex items-center gap-0.5 mt-1"
            >
              Review inventory →
            </Link>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Grid: Recent Orders & Catalog Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Orders (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No orders recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-100 font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Order #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          #{ord.order_number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {ord.shipping_address.first_name} {ord.shipping_address.last_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              ord.status === "delivered"
                                ? "success"
                                : ord.status === "cancelled"
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                          >
                            {ord.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 uppercase font-semibold text-slate-600">
                          {ord.payment_status}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {formatPrice(ord.total_amount, ord.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="font-semibold text-emerald-600 hover:underline"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Low Stock & Catalog Shortcuts (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Low Stock Items List */}
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Inventory
            </h3>
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400">All products have healthy inventory levels.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 truncate max-w-[160px]">{p.name}</p>
                      <p className="text-slate-400">SKU: {p.sku}</p>
                    </div>
                    <span className="font-bold text-amber-600">{p.stock_quantity} left</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/inventory" className="block pt-2">
              <Button size="sm" variant="outline" className="w-full text-xs">
                Open Stock Adjuster
              </Button>
            </Link>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Quick Admin Actions
            </h3>
            <Link
              href="/admin/categories"
              className="flex items-center justify-between text-xs text-slate-700 hover:text-emerald-600 py-2 border-b border-slate-100"
            >
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-500" /> Categories Manager
              </span>
              <span>→</span>
            </Link>
            <Link
              href="/admin/homepage"
              className="flex items-center justify-between text-xs text-slate-700 hover:text-emerald-600 py-2 border-b border-slate-100"
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500" /> Edit Storefront Banners
              </span>
              <span>→</span>
            </Link>
            <Link
              href="/admin/media"
              className="flex items-center justify-between text-xs text-slate-700 hover:text-emerald-600 py-2"
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-500" /> Media Library
              </span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
