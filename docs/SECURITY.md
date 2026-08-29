# 🛡️ Enterprise E-Commerce Security Architecture

Security is implemented as a fundamental system constraint.

---

## 1. Zero-Trust Server Calculations

Clients are treated as untrusted runtime environments:
- Product prices, compare-at amounts, discounts, and inventory availability are always queried directly from PostgreSQL.
- Cart and checkout totals are recalculated on every request before order creation or payment authorization.

---

## 2. Cryptographic Payment Verification

- **Razorpay HMAC-SHA256**: Signatures sent to `/api/payments/razorpay/verify` are hashed server-side using the secret key before order capture.
- **Webhook Authenticity**: Webhooks from `/api/payments/webhook` require matching header signatures before processing asynchronous events.

---

## 3. Database Security & Row Level Security (RLS)

- **RLS Enabled**: `users`, `addresses`, `carts`, `cart_items`, `orders`, `order_items`, and `wishlists` have strict policies.
- **Data Isolation**: Customers can only read and mutate records associated with their `auth.uid()`.
- **Role Enforcement**: Admin endpoints and dashboard controls enforce roles (`staff`, `admin`, `super_admin`) server-side.

---

## 4. Race Condition & Overselling Prevention

- Atomic inventory deductions use PostgreSQL stored procedures with `FOR UPDATE` row locks.
- Every inventory alteration generates an immutable audit record in `inventory_transactions`.
