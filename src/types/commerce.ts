import { Address, Coupon, Order, Product, ProductVariant } from "./database";

export interface ProductFilterParams {
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
    quantity: number;
    totalPrice: number;
    attributes?: Record<string, string>;
    inStock: boolean;
    availableStock: number;
  }[];
  subtotal: number;
  discount: {
    code?: string;
    amount: number;
  };
  shipping: {
    methodId?: string;
    title: string;
    amount: number;
  };
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
