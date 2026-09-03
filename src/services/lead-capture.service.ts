import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Email capture: back-in-stock alerts and newsletter sign-ups.
 *
 * Both tables have no anon RLS policy by design — an email list readable with
 * the public key is a harvestable customer list. Writes therefore run through
 * the service role here, after validation and after the calling route has
 * rate-limited the request.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  // Longer than any real address; a cap stops an oversized body reaching the DB.
  .max(254);

export const backInStockSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  email: emailSchema,
});

export const newsletterSchema = z.object({
  email: emailSchema,
  source: z.string().trim().max(60).optional(),
});

export class LeadCaptureService {
  /**
   * Register interest in an out-of-stock product.
   *
   * Idempotent: signing up twice updates the existing row rather than erroring,
   * because "you are already on the list" is not a useful thing to tell someone
   * who just wants to be told when the item returns.
   */
  static async requestBackInStock(input: unknown, userId?: string): Promise<void> {
    const { productId, variantId, email } = backInStockSchema.parse(input);
    const client = createAdminClient();

    // Only accept requests for a product that exists and is genuinely
    // unavailable, so the table cannot be used to enumerate product ids.
    const { data: product } = await client
      .from("products")
      .select("id, stock_quantity, status")
      .eq("id", productId)
      .eq("status", "active")
      .single();

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const { error } = await client.from("back_in_stock_requests").upsert(
      {
        product_id: productId,
        variant_id: variantId || null,
        email,
        user_id: userId || null,
        notified_at: null,
      },
      { onConflict: "product_id,variant_id,email" }
    );

    if (error) {
      throw new Error(`Failed to register interest: ${error.message}`);
    }
  }

  /**
   * Newsletter opt-in.
   *
   * Re-subscribing clears a previous unsubscribe, which is the behaviour a
   * customer expects when they deliberately sign up again — but it never
   * silently resurrects an address that did not just ask.
   */
  static async subscribeToNewsletter(input: unknown): Promise<void> {
    const { email, source } = newsletterSchema.parse(input);
    const client = createAdminClient();

    const { error } = await client.from("newsletter_subscribers").upsert(
      {
        email,
        source: source || "storefront",
        consented_at: new Date().toISOString(),
        unsubscribed_at: null,
      },
      { onConflict: "email" }
    );

    if (error) {
      throw new Error(`Failed to subscribe: ${error.message}`);
    }
  }

  /** Honour an unsubscribe link. The token is the only credential needed. */
  static async unsubscribe(token: string): Promise<boolean> {
    if (!z.string().uuid().safeParse(token).success) return false;

    const client = createAdminClient();
    const { data, error } = await client
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .select("id");

    return !error && (data?.length ?? 0) > 0;
  }

  /**
   * Everyone waiting on a product, for the admin restock flow.
   * Admin-authorised callers only.
   */
  static async getPendingBackInStock(productId: string): Promise<{ email: string; id: string }[]> {
    const client = createAdminClient();
    const { data, error } = await client
      .from("back_in_stock_requests")
      .select("id, email")
      .eq("product_id", productId)
      .is("notified_at", null);

    if (error) return [];
    return (data || []) as { email: string; id: string }[];
  }
}
