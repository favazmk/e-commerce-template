"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Power, PowerOff, Pencil, Tag } from "lucide-react";
import { Coupon } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getCurrencyLabel } from "@/lib/config/store.config";

/** The shape the create/edit form works with, all strings for input binding. */
interface CouponFormState {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  usageLimit: string;
  perCustomerLimit: string;
  endDate: string;
}

const EMPTY_FORM: CouponFormState = {
  code: "",
  discountType: "percentage",
  discountValue: "10",
  minOrderValue: "0",
  maxDiscount: "",
  usageLimit: "",
  perCustomerLimit: "1",
  endDate: "",
};

export default function AdminCouponsPage() {
  const currency = getCurrencyLabel();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);

  const notify = (tone: "ok" | "error", text: string) => {
    setFeedback({ tone, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setCoupons(data.coupons || []);
      else notify("error", data.error?.message || "Could not load coupons.");
    } catch {
      notify("error", "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCoupons();
  }, [fetchCoupons]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discount_type === "fixed" ? "fixed" : "percentage",
      discountValue: String(coupon.discount_value),
      minOrderValue: String(coupon.min_order_value ?? 0),
      maxDiscount: coupon.max_discount_amount != null ? String(coupon.max_discount_amount) : "",
      usageLimit: coupon.usage_limit != null ? String(coupon.usage_limit) : "",
      perCustomerLimit: String(coupon.per_customer_limit ?? 1),
      endDate: coupon.end_date ? coupon.end_date.slice(0, 10) : "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      code: form.code,
      discount_type: form.discountType,
      discount_value: Number(form.discountValue),
      min_order_value: Number(form.minOrderValue) || 0,
      max_discount_amount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
      usage_limit: form.usageLimit === "" ? null : Number(form.usageLimit),
      per_customer_limit: Number(form.perCustomerLimit) || 1,
      end_date: form.endDate ? new Date(`${form.endDate}T23:59:59`).toISOString() : null,
    };

    try {
      const res = await fetch(
        editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Could not save the coupon.");
      }

      setIsModalOpen(false);
      notify("ok", editingId ? "Coupon updated." : "Coupon created.");
      await fetchCoupons();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    // Optimistic flip, reverted by the refetch if the server disagrees.
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
    );

    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Update failed.");
      notify("ok", `${coupon.code} is now ${!coupon.is_active ? "active" : "paused"}.`);
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      await fetchCoupons();
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    try {
      const res = await fetch(`/api/admin/coupons/${target.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Delete failed.");
      notify("ok", `${target.code} deleted.`);
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      await fetchCoupons();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Promotions &amp; Discounts
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Coupons &amp; Vouchers ({coupons.length})
          </h1>
        </div>
        <Button variant="primary" size="md" onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {feedback && (
        <div
          className={`rounded-brand border p-3 text-xs font-semibold ${
            feedback.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-slate-400">Loading coupons…</p>
      ) : coupons.length === 0 ? (
        <div className="rounded-brand-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Tag className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No coupons yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Create a code your customers can enter at checkout.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const isExhausted =
              coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit;
            const isExpired = Boolean(coupon.end_date && new Date(coupon.end_date) < new Date());

            return (
              <div
                key={coupon.id}
                className={`rounded-brand-xl border bg-white p-6 shadow-subtle flex flex-col justify-between ${
                  coupon.is_active ? "border-slate-200" : "border-slate-200 bg-slate-50 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-brand text-xs font-mono font-bold tracking-wider break-all">
                      {coupon.code}
                    </span>
                    <Badge variant={coupon.is_active ? "success" : "default"} size="sm">
                      {coupon.is_active ? "ACTIVE" : "PAUSED"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900 font-heading">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold uppercase">Discount</span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <p>Min. spend: {formatPrice(coupon.min_order_value || 0)}</p>
                    {coupon.max_discount_amount != null && (
                      <p>Max discount cap: {formatPrice(coupon.max_discount_amount)}</p>
                    )}
                    <p>
                      Used: {coupon.usage_count} / {coupon.usage_limit ?? "Unlimited"}
                    </p>
                    <p>Limit per customer: {coupon.per_customer_limit ?? 1}</p>
                    {coupon.end_date && (
                      <p className={isExpired ? "font-semibold text-rose-600" : ""}>
                        {isExpired ? "Expired" : "Expires"}:{" "}
                        {new Date(coupon.end_date).toLocaleDateString()}
                      </p>
                    )}
                    {isExhausted && (
                      <p className="font-semibold text-amber-600">Usage limit reached</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(coupon)}
                    className="gap-1.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleActive(coupon)}
                    className="gap-1.5 text-xs"
                  >
                    {coupon.is_active ? (
                      <>
                        <PowerOff className="h-3.5 w-3.5" /> Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-3.5 w-3.5 text-emerald-600" /> Activate
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setPendingDelete(coupon)}
                    className="ml-auto rounded-brand p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    title="Delete coupon"
                    aria-label={`Delete coupon ${coupon.code}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Coupon" : "Create Promotional Coupon"}
        description="Set a percentage or fixed-cash discount, with optional spend and usage limits."
      >
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            label="Coupon Code"
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="VIP20"
            helperText="3–32 characters. Letters, numbers, hyphen or underscore."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="discountType"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Discount Type
              </label>
              <select
                id="discountType"
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value as "percentage" | "fixed" })
                }
                className="w-full rounded-brand border border-slate-300 bg-white p-2.5 text-xs focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Cash ({currency})</option>
              </select>
            </div>
            <Input
              label={form.discountType === "percentage" ? "Discount Value (%)" : `Discount Value (${currency})`}
              type="number"
              step="0.01"
              min="0"
              max={form.discountType === "percentage" ? "100" : undefined}
              required
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Min Order Spend (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderValue}
              onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
            />
            <Input
              label={`Max Discount Cap (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={form.maxDiscount}
              onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
              placeholder="Leave blank for no cap"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Usage Limit"
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              placeholder="Leave blank for unlimited"
            />
            <Input
              label="Uses Per Customer"
              type="number"
              min="1"
              value={form.perCustomerLimit}
              onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })}
            />
          </div>

          <Input
            label="Expiry Date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            helperText="Leave blank for a coupon that never expires."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {editingId ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={`Delete ${pendingDelete?.code}?`}
        description="This permanently removes the coupon. If it has already been used on orders, deactivating it instead keeps that history intact."
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
