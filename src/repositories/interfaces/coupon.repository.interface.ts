import { Coupon } from "../../types/database";

export interface ICouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  findById(id: string): Promise<Coupon | null>;
  findAll(): Promise<Coupon[]>;
  create(data: Partial<Coupon>): Promise<Coupon>;
  update(id: string, data: Partial<Coupon>): Promise<Coupon | null>;
  delete(id: string): Promise<boolean>;
  recordUsage(couponId: string, userId?: string, orderId?: string): Promise<void>;
  validateCouponForUser(couponId: string, userId?: string): Promise<boolean>;
}
