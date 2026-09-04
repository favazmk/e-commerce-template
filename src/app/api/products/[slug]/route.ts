import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/product.service";
import { revalidateProduct } from "@/lib/cache/revalidate";
import { requireAdmin } from "@/lib/auth/session";
import { ChangeLogService } from "@/services/changelog.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = (await ProductService.getProductBySlug(slug)) || (await ProductService.getProductById(slug));

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_PRODUCT_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { slug: id } = await params;
    const body = await request.json();

    // Capture the record as it stands before the write, so the change is undoable.
    const before = await ProductService.getProductById(id);
    const updated = await ProductService.updateProduct(id, body);

    if (updated && before) {
      await ChangeLogService.record({
        entityType: "product",
        entityId: id,
        entityLabel: updated.name,
        action: "update",
        summary: `Edited the product "${updated.name}"`,
        before: before as unknown as Record<string, any>,
        after: updated as unknown as Record<string, any>,
        actor: auth.user,
      });
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    // Both slugs: an edit can move a product to a different category or change
    // its slug, and the page it left behind needs refreshing too.
    revalidateProduct({ slug: updated.slug, categorySlug: updated.category?.slug });
    if (before && before.slug !== updated.slug) {
      revalidateProduct({ slug: before.slug, categorySlug: before.category?.slug });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_PRODUCT_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const { slug: id } = await params;

    // Snapshot before deleting: this is the only copy that makes the delete undoable.
    const before = await ProductService.getProductById(id);
    const deleted = await ProductService.deleteProduct(id);

    if (deleted && before) {
      await ChangeLogService.record({
        entityType: "product",
        entityId: id,
        entityLabel: before.name,
        action: "delete",
        summary: `Deleted the product "${before.name}"`,
        before: before as unknown as Record<string, any>,
        after: null,
        actor: auth.user,
      });
    }

    if (deleted && before) {
      // A deleted product must leave the sitemap and the shopping feeds
      // immediately, or Google keeps crawling a URL that now 404s.
      revalidateProduct({ slug: before.slug, categorySlug: before.category?.slug });
    }

    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "DELETE_PRODUCT_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}
