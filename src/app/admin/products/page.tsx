import React from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { ProductService } from "@/services/product.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductRowActions } from "./ProductRowActions";
import Image from "next/image";
import { formatPrice } from "@/lib/config/store.config";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const products = await ProductService.getAllAdminProducts(params.q, params.status);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Catalog Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Store Products ({products.length})
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/products/import">
            <Button variant="outline" size="md" className="gap-2">
              <Upload className="h-4 w-4" /> Import from spreadsheet
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button variant="primary" size="md" className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Create New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Inventory</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Thumbnail & Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 rounded-brand bg-slate-100 overflow-hidden border border-slate-100">
                        {product.images?.[0]?.url && (
                          <Image fill sizes="40px"
                            src={product.images[0].url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="font-bold text-slate-900 hover:text-emerald-600 truncate max-w-xs block"
                        >
                          {product.name}
                        </Link>
                        <span className="text-[10px] text-slate-400">{product.brand || "—"}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    {product.category?.name || "Unassigned"}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-500">{product.sku}</td>

                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {formatPrice(product.price)}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`font-semibold ${
                        product.stock_quantity === 0
                          ? "text-rose-600"
                          : product.stock_quantity <= product.low_stock_threshold
                          ? "text-amber-600"
                          : "text-slate-800"
                      }`}
                    >
                      {product.stock_quantity} in stock
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant={product.status === "active" ? "success" : "default"}
                      size="sm"
                    >
                      {product.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <ProductRowActions
                      productId={product.id}
                      productName={product.name}
                      productSlug={product.slug}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
