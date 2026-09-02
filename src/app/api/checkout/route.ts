import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/services/order.service";
import { getSessionUserId } from "@/lib/auth/session";
import { SettingsService } from "@/services/settings.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Identity is resolved from the session cookie only. A client supplied
    // user id (header/body) is untrusted and must never attribute an order.
    const userId = await getSessionUserId();

    // Guest checkout is a server-side rule, not a UI one. Hiding the guest
    // form would still leave this endpoint open to a direct request.
    if (!userId) {
      const { guestCheckout } = await SettingsService.getStoreFeatures();
      if (!guestCheckout) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SIGN_IN_REQUIRED",
              message: "Please sign in to complete your order.",
            },
          },
          { status: 401 }
        );
      }
    }

    const result = await OrderService.createOrder(body, userId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[Checkout API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CHECKOUT_FAILED",
          message: error.message || "Failed to process checkout and place order",
        },
      },
      { status: 400 }
    );
  }
}
