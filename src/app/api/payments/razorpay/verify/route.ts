import { NextRequest, NextResponse } from "next/server";
import { PaymentFactory } from "@/lib/payments/payment.factory";
import { OrderService } from "@/services/order.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, providerOrderId, signature } = body;

    if (!orderId || !paymentId || !providerOrderId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_VERIFICATION_REQUEST",
            message: "orderId, paymentId, providerOrderId and signature are all required",
          },
        },
        { status: 400 }
      );
    }

    const razorpayProvider = PaymentFactory.getProvider("razorpay");
    const verification = await razorpayProvider.verifyPayment({
      orderId,
      paymentId,
      providerOrderId,
      signature,
    });

    if (!verification.isSuccessful) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SIGNATURE_VERIFICATION_FAILED",
            message: verification.error || "Payment signature invalid",
          },
        },
        { status: 400 }
      );
    }

    // Passing providerOrderId is what binds the verified signature to THIS
    // order. Without it a signature valid for one order could settle another.
    const updatedOrder = await OrderService.confirmOrderPayment(
      orderId,
      verification.transactionId,
      "razorpay",
      signature,
      providerOrderId
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: { code: "ORDER_NOT_FOUND", message: "Order not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder,
        verified: true,
      },
    });
  } catch (error: any) {
    console.error("[Payment Verify Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PAYMENT_VERIFICATION_ERROR",
          message: "Payment verification could not be completed",
        },
      },
      { status: 500 }
    );
  }
}
