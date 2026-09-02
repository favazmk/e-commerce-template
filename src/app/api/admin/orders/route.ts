import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "@/services/order.service";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const orders = await OrderService.getAllAdminOrders(status, search);
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_ORDERS_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { orderId, status, notes, changedBy } = body;

    const updated = await OrderService.updateOrderStatus(orderId, status, notes, changedBy);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "ORDER_NOT_FOUND", message: "Order not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_ORDER_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
