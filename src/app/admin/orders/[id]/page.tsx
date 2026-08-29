import React from "react";
import { notFound } from "next/navigation";
import { OrderService } from "@/services/order.service";
import { OrderDetailClient } from "./OrderDetailClient";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await OrderService.getOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient initialOrder={order} />;
}
