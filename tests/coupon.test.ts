import { describe, it, expect, beforeEach } from "vitest";
import { CouponService } from "../src/services/coupon.service";
import { RepositoryFactory } from "../src/repositories/repository.factory";
import { MockCouponRepository, resetMockData, mockData } from "./__mocks__/repositories";

describe("Commerce Core: Coupon Service", () => {
  beforeEach(() => {
    RepositoryFactory.setOverride("CouponRepository", new MockCouponRepository());
    resetMockData();
  });

  it("should apply percentage discount with max cap enforcement", async () => {
    // WELCOME10 gives 10% with max $100 cap
    mockData.coupons[0].max_discount_amount = 100;
    const res = await CouponService.validateCoupon("WELCOME10", 500);

    expect(res.isValid).toBe(true);
    expect(res.discountAmount).toBe(50); // 10% of 500 = 50
  });

  it("should cap percentage discounts at max_discount_amount", async () => {
    mockData.coupons[0].max_discount_amount = 100;
    const res = await CouponService.validateCoupon("WELCOME10", 2000);

    expect(res.isValid).toBe(true);
    expect(res.discountAmount).toBe(100); // Capped at $100 max
  });

  it("should reject coupons when subtotal is below minimum order value", async () => {
    // MIN100 requires min spend of $100
    const res = await CouponService.validateCoupon("MIN100", 50);

    expect(res.isValid).toBe(false);
    expect(res.discountAmount).toBe(0);
    expect(res.error).toContain("Minimum order value");
  });

  it("should reject expired coupons", async () => {
    // Add expired coupon to DB
    mockData.coupons.push({
      id: "coup-expired",
      code: "EXPIRED99",
      discount_type: "percentage",
      discount_value: 50,
      end_date: new Date(Date.now() - 86400000).toISOString(),
      is_active: true,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await CouponService.validateCoupon("EXPIRED99", 500);

    expect(res.isValid).toBe(false);
    expect(res.error).toContain("expired");
  });

  it("should reject coupons that have exceeded total usage limit", async () => {
    mockData.coupons.push({
      id: "coup-maxed",
      code: "MAXEDOUT",
      discount_type: "percentage",
      discount_value: 20,
      usage_limit: 5,
      usage_count: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await CouponService.validateCoupon("MAXEDOUT", 200);

    expect(res.isValid).toBe(false);
    expect(res.error).toContain("limit");
  });
});
