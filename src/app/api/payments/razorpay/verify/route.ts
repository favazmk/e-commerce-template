import { NextRequest, NextResponse } from "next/server";
import { PaymentFactory } from "@/lib/payments/payment.factory";
import { OrderService } from "@/services/order.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, providerOrderId, signature } = body;

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

    // Confirm order payment in database
    const updatedOrder = await OrderService.confirmOrderPayment(
      orderId,
      verification.transactionId,
      "razorpay",
      signature
    );

    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder,
        verified: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "PAYMENT_VERIFICATION_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
