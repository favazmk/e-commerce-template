import { NextRequest, NextResponse } from "next/server";
import { PaymentFactory } from "@/lib/payments/payment.factory";
import { OrderService } from "@/services/order.service";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const provider = PaymentFactory.getProvider("razorpay");

    const webhookResult = await provider.handleWebhook(rawBody, signature);

    if (webhookResult.isHandled && webhookResult.orderId) {
      const supabase = createAdminClient();
      const eventId = webhookResult.paymentId || `${webhookResult.orderId}_${Date.now()}`;
      
      // Idempotency Check
      const { error: insertError } = await supabase.from('processed_webhooks').insert([{
        provider: 'razorpay',
        event_id: eventId,
        event_type: webhookResult.status,
        payload: JSON.parse(rawBody)
      }]);

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          console.log(`[Webhook] Event ${eventId} already processed.`);
          return NextResponse.json({ success: true, status: "already_processed" });
        }
        throw insertError;
      }

      if (webhookResult.status === "captured") {
        await OrderService.confirmOrderPayment(
          webhookResult.orderId,
          webhookResult.paymentId || "webhook_captured",
          "razorpay_webhook"
        );
      }
    }

    return NextResponse.json({ success: true, status: "webhook_received" });
  } catch (error: any) {
    console.error("[Webhook Error]", error);
    // Do not echo internal error text to an unauthenticated caller.
    return NextResponse.json(
      { success: false, error: { code: "WEBHOOK_FAILED", message: "Webhook rejected" } },
      { status: 400 }
    );
  }
}
