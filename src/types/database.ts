export type UserRole = "customer" | "staff" | "admin" | "super_admin";
export type ProductStatus = "draft" | "active" | "archived" | "out_of_stock";
export type InventoryTransactionType =
  | "purchase"
  | "sale"
  | "refund"
  | "adjustment"
  | "cancellation"
  | "reservation";
export type CouponDiscountType = "percentage" | "fixed";
export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "paid"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "failed";
export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  display_order: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  subcategories?: Category[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export type ProductBadgeTone = "primary" | "success" | "discount" | "urgent" | "neutral";

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  stock: number;
  image_url?: string | null;
  barcode?: string | null;
  is_active: boolean;
  /** Hex drawn as a colour swatch on the product card, e.g. "#1B2A4A". */
  swatch_hex?: string | null;
  /** The variant the card previews. Exactly one per product. */
  is_default?: boolean;
  attributes: Record<string, string>; // e.g. {"Size": "L", "Color": "Navy"}
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  currency: string;
  stock_quantity: number;
  low_stock_threshold: number;
  status: ProductStatus;
  featured: boolean;
  /** Merchant-set badge, e.g. "BESTSELLER". Null lets the storefront derive one. */
  badge_label?: string | null;
  badge_tone?: ProductBadgeTone;
  category_id?: string | null;
  category?: Category | null;
  brand?: string | null;
  tags: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  metadata?: Record<string, any>;
  images?: ProductImage[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  variant_id?: string | null;
  quantity_change: number;
  transaction_type: InventoryTransactionType;
  reference_id?: string | null;
  note?: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  type: "shipping" | "billing";
  first_name: string;
  last_name: string;
  company?: string | null;
  address_1: string;
  address_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id?: string | null;
  guest_token?: string | null;
  items: CartItem[];
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_value?: number | null;
  max_discount_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  per_customer_limit?: number | null;
  product_ids?: string[];
  category_ids?: string[];
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_name_snapshot: string;
  sku_snapshot: string;
  price_snapshot: number;
  image_snapshot?: string | null;
  quantity: number;
  total_price: number;
  attributes_snapshot?: Record<string, string>;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string | null;
  changed_by?: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  payment_provider: string; // 'razorpay' | 'stripe' | 'manual'
  provider_order_id?: string | null;
  transaction_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  signature?: string | null;
  payload?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  payment_id: string;
  order_id: string;
  amount: number;
  reason?: string | null;
  status: string;
  provider_refund_id?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  shipping_address: Omit<Address, "id" | "user_id" | "is_default" | "created_at" | "updated_at">;
  billing_address: Omit<Address, "id" | "user_id" | "is_default" | "created_at" | "updated_at">;
  shipping_method: {
    id: string;
    title: string;
    rate: number;
    estimated_days?: string;
  };
  coupon_code?: string | null;
  coupon_discount?: number;
  customer_notes?: string | null;
  admin_notes?: string | null;
  items?: OrderItem[];
  payments?: Payment[];
  history?: OrderStatusHistory[];
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

export interface StoreSetting {
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

export interface HomepageSection {
  id: string;
  section_type:
    | "hero"
    | "featured_products"
    | "categories"
    | "banner"
    | "collection"
    | "testimonials"
    | "brand_story"
    | "newsletter"
    | "cta"
    | "custom";
  title?: string | null;
  subtitle?: string | null;
  content: Record<string, any>;
  image_url?: string | null;
  settings: Record<string, any>;
  display_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id?: string | null;
  customer_name: string;
  rating: number;
  title?: string | null;
  comment: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

/** The kinds of record the admin panel can undo a change to. */
export type AdminChangeEntityType =
  | "product"
  | "category"
  | "coupon"
  | "homepage_section"
  | "settings"
  | "inventory"
  | "review";

export type AdminChangeAction = "create" | "update" | "delete";

/**
 * One entry in the admin undo history. `before_state` and `after_state` hold
 * the full record rather than a diff, so a restore stays possible even after
 * the schema moves on.
 */
export interface AdminChangeLogEntry {
  id: string;
  entity_type: AdminChangeEntityType;
  entity_id: string;
  entity_label: string;
  action: AdminChangeAction;
  summary: string;
  before_state: Record<string, any> | null;
  after_state: Record<string, any> | null;
  actor_id?: string | null;
  actor_email: string;
  reverted_at?: string | null;
  reverted_by?: string | null;
  is_revert: boolean;
  created_at: string;
}
