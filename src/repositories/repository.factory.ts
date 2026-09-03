import { IProductRepository } from "./interfaces/product.repository.interface";
import { ICategoryRepository } from "./interfaces/category.repository.interface";
import { ICartRepository } from "./interfaces/cart.repository.interface";
import { IOrderRepository } from "./interfaces/order.repository.interface";
import { IInventoryRepository } from "./interfaces/inventory.repository.interface";
import { ICouponRepository } from "./interfaces/coupon.repository.interface";
import { IUserRepository } from "./interfaces/user.repository.interface";
import { ISettingsRepository } from "./interfaces/settings.repository.interface";
import { IReviewRepository } from "./interfaces/review.repository.interface";
import { IChangeLogRepository } from "./interfaces/changelog.repository.interface";
import { IMerchandisingRepository } from "./interfaces/merchandising.repository.interface";
import { IAddressRepository } from "./interfaces/address.repository.interface";

import { SupabaseProductRepository } from "./supabase/product.repository";
import { SupabaseCategoryRepository } from "./supabase/category.repository";
import { SupabaseCartRepository } from "./supabase/cart.repository";
import { SupabaseOrderRepository } from "./supabase/order.repository";
import { SupabaseInventoryRepository } from "./supabase/inventory.repository";
import { SupabaseCouponRepository } from "./supabase/coupon.repository";
import { SupabaseUserRepository } from "./supabase/user.repository";
import { SupabaseSettingsRepository } from "./supabase/settings.repository";
import { SupabaseReviewRepository } from "./supabase/review.repository";
import { SupabaseChangeLogRepository } from "./supabase/changelog.repository";
import { SupabaseMerchandisingRepository } from "./supabase/merchandising.repository";
import { SupabaseAddressRepository } from "./supabase/address.repository";

// Currently wired to Supabase implementations.
// In the future, this can read an env variable to wire to different implementations.
export class RepositoryFactory {
  private static overrides = new Map<string, any>();

  static setOverride<T>(key: string, implementation: T) {
    this.overrides.set(key, implementation);
  }

  static clearOverrides() {
    this.overrides.clear();
  }

  static getProductRepository(): IProductRepository {
    return this.overrides.get("ProductRepository") || new SupabaseProductRepository();
  }

  static getCategoryRepository(): ICategoryRepository {
    return this.overrides.get("CategoryRepository") || new SupabaseCategoryRepository();
  }

  static getCartRepository(): ICartRepository {
    return this.overrides.get("CartRepository") || new SupabaseCartRepository();
  }

  static getOrderRepository(): IOrderRepository {
    return this.overrides.get("OrderRepository") || new SupabaseOrderRepository();
  }

  static getInventoryRepository(): IInventoryRepository {
    return this.overrides.get("InventoryRepository") || new SupabaseInventoryRepository();
  }

  static getCouponRepository(): ICouponRepository {
    return this.overrides.get("CouponRepository") || new SupabaseCouponRepository();
  }

  static getUserRepository(): IUserRepository {
    return this.overrides.get("UserRepository") || new SupabaseUserRepository();
  }

  static getSettingsRepository(): ISettingsRepository {
    return this.overrides.get("SettingsRepository") || new SupabaseSettingsRepository();
  }

  static getReviewRepository(): IReviewRepository {
    return this.overrides.get("ReviewRepository") || new SupabaseReviewRepository();
  }

  static getChangeLogRepository(): IChangeLogRepository {
    return this.overrides.get("ChangeLogRepository") || new SupabaseChangeLogRepository();
  }
  static getMerchandisingRepository(): IMerchandisingRepository {
    return this.overrides.get("MerchandisingRepository") || new SupabaseMerchandisingRepository();
  }

  static getAddressRepository(): IAddressRepository {
    return this.overrides.get("AddressRepository") || new SupabaseAddressRepository();
  }

}
