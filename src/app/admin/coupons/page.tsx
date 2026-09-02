"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tag, Trash2, CheckCircle2, Percent, DollarSign } from "lucide-react";
import { Coupon } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrderValue, setMinOrderValue] = useState("50");
  const [maxDiscount, setMaxDiscount] = useState("100");
  const [usageLimit, setUsageLimit] = useState("500");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success && data.coupons) {
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error("Failed to load coupons", error);
    }
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const newCoup: Coupon = {
      id: `coup-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue) || 10,
      min_order_value: Number(minOrderValue) || 0,
      max_discount_amount: maxDiscount ? Number(maxDiscount) : null,
      usage_limit: Number(usageLimit) || 1000,
      usage_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCoupons((prev) => [newCoup, ...prev]);
    setIsModalOpen(false);
    setCode("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Promotions & Discounts
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Coupons & Vouchers ({coupons.length})
          </h1>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-slate-900 text-white rounded-brand text-xs font-mono font-bold tracking-wider">
                  {coupon.code}
                </span>
                <Badge variant={coupon.is_active ? "success" : "default"} size="sm">
                  {coupon.is_active ? "ACTIVE" : "EXPIRED"}
                </Badge>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 font-heading">
                  {coupon.discount_type === "percentage"
                    ? `${coupon.discount_value}%`
                    : `$${coupon.discount_value}`}
                </span>
                <span className="text-xs text-slate-500 font-semibold uppercase">Discount</span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p>Min. Spend: ${coupon.min_order_value || 0}</p>
                {coupon.max_discount_amount && <p>Max Discount Cap: ${coupon.max_discount_amount}</p>}
                <p>Usage: {coupon.usage_count} / {coupon.usage_limit || "Unlimited"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Coupon"
        description="Configure discount percentage or fixed cash discount with minimum order limits."
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
          <Input
            label="Coupon Code (e.g. VIP20)"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VIP20"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full rounded-brand border border-slate-300 bg-white p-2.5 text-xs focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Cash ($)</option>
              </select>
            </div>
            <Input
              label="Discount Value"
              type="number"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Order Spend ($)"
              type="number"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
            />
            <Input
              label="Max Discount Cap ($)"
              type="number"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
            />
          </div>

          <Input
            label="Total Usage Limit"
            type="number"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Coupon
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
