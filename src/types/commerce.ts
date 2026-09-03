import { Address, Coupon, Order, Product, ProductVariant } from "./database";

export interface ProductFilterParams {
  /**
   * Catalog reads default to published products only. Admin screens pass
   * "all" to include drafts and archived items.
   *
   * This filter is load-bearing: catalog queries run through the service-role
   * client to keep ISR pages cacheable, so the "Public can view active
   * products" RLS policy does not apply to them.
   */
  status?: "active" | "draft" | "archived" | "out_of_stock" | "all";
  categorySlug?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest" | "featured" | "name_asc";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartCalculationResult {
  items: {
    productId: string;
    variantId?: string | null;
    name: string;
    sku: string;
    image?: string | null;
    unitPrice: number;
    /** Pre-discount list price (compare-at), when the merchant set one. */
    listPrice?: number | null;
    quantity: number;
    totalPrice: number;
    attributes?: Record<string, string>;
    inStock: boolean;
    availableStock: number;
  }[];
  subtotal: number;
  /**
   * Subtotal at list prices, so the cart can show what the shopper saved
   * against the marked price before any coupon is applied.
   */
  listSubtotal: number;
  discount: {
    code?: string;
    amount: number;
  };
  shipping: {
    methodId?: string;
    title: string;
    amount: number;
  };
  /**
   * Shipping options as configured on the server. The storefront must render
   * these rather than a hard-coded list, otherwise the rate shown to the
   * customer can differ from the rate actually charged.
   */
  availableShippingMethods: {
    id: string;
    name: string;
    rate: number;
    free_threshold?: number;
    estimated_days?: string;
  }[];
  tax: {
    rate: number;
    amount: number;
    isInclusive: boolean;
  };
  total: number;
  currency: string;
  isValid: boolean;
  validationErrors: string[];
}

export interface CheckoutInput {
  guestEmail?: string;
  guestPhone?: string;
  shippingAddress: Omit<Address, "id" | "user_id" | "is_default" | "created_at" | "updated_at">;
  billingAddress: Omit<Address, "id" | "user_id" | "is_default" | "created_at" | "updated_at">;
  shippingMethodId: string;
  couponCode?: string;
  paymentProvider: "razorpay" | "stripe" | "mock";
  customerNotes?: string;
  cartItems: {
    productId: string;
    variantId?: string | null;
    quantity: number;
  }[];
}

export interface OrderCreationResult {
  order: Order;
  paymentInitializationData: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
}
