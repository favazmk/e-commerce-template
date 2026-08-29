import { NextRequest, NextResponse } from "next/server";
import { RepositoryFactory } from "@/repositories/repository.factory";

export async function GET(request: NextRequest) {
  try {
    const repo = RepositoryFactory.getCouponRepository();
    const coupons = await repo.findAll();
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
