# 🔌 Hardware POS & Third-Party Integration Architecture

This platform provides dedicated abstraction layers for Point-of-Sale (POS) hardware, transactional email engines, and analytics trackers.

---

## 1. Sunmi POS Hardware Integration

To support upcoming retail clients operating physical smart POS terminals (Sunmi V2, T2, D2, K2), the platform exposes the `POSProvider` interface and a `SunmiPOSProvider` implementation:

```typescript
export interface POSProvider {
  readonly name: string;
  createOrder(params: POSCreateOrderParams): Promise<POSSyncResult>;
  syncProduct(params: POSSyncProductParams): Promise<POSSyncResult>;
  syncInventory(params: POSSyncInventoryParams): Promise<POSSyncResult>;
  getOrderStatus(posOrderId: string): Promise<{ status: string; receiptUrl?: string }>;
  cancelOrder(posOrderId: string, reason?: string): Promise<POSSyncResult>;
}
```

### Capabilities
- **Real-Time Order Push**: Dispatches online orders to Sunmi terminal printers.
- **Inventory Sync**: Keeps physical store inventory and web inventory synchronized.
- **Receipt Printing**: Generates fiscal receipt URLs.

---

## 2. Transactional Email System (`EmailService`)

Transactional notifications (Order Confirmation, Status Update, Password Reset) are dispatched asynchronously:
- **Resend API Integration**: Directly dispatches responsive HTML emails if `RESEND_API_KEY` is present.
- **Console Fallback**: Logs structured email payloads in development environments.

---

## 3. Analytics Integration (`AnalyticsService`)

Supports standard Google Analytics 4 (GA4) e-commerce events and Meta Pixel:
- `view_item`
- `view_item_list`
- `add_to_cart`
- `begin_checkout`
- `purchase`
