import React from "react";
import Link from "next/link";
import { ShoppingCart, Search, Eye, Filter } from "lucide-react";
import { OrderService } from "@/services/order.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/config/store.config";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const orders = await OrderService.getAllAdminOrders(params.status, params.search);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Fulfillment & Sales
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Customer Orders ({orders.length})
          </h1>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No orders match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Items</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      #{ord.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">
                        {ord.shipping_address.first_name} {ord.shipping_address.last_name}
                      </p>
                      <p className="text-[10px] text-slate-400">{ord.guest_email || "N/A"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(ord.created_at).toLocaleDateString()}
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
                        {ord.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 uppercase font-bold text-slate-700">
                      {ord.payment_status}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {ord.items?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatPrice(ord.total_amount, ord.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/orders/${ord.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          Inspect
                        </Button>
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
  );
}
