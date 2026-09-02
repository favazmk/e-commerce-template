import { NextRequest, NextResponse } from "next/server";
import { RepositoryFactory } from "@/repositories/repository.factory";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const repo = RepositoryFactory.getCouponRepository();
    const coupons = await repo.findAll();
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
