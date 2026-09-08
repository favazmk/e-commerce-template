import React from "react";
import Link from "next/link";
import { Plus, Upload, Download } from "lucide-react";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { Button } from "@/components/ui/button";
import { ProductTable } from "./ProductTable";

/** The filters offered above the table, including two that are derived. */
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "on_sale", label: "On sale" },
  { value: "archived", label: "Archived" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const activeStatus = params.status || "all";

  const [products, categories] = await Promise.all([
    ProductService.getAllAdminProducts(params.q, params.status),
    CategoryService.getCategories(false),
  ]);

  // The export downloads exactly what the table is showing, so "export what I
  // am looking at" needs no separate filter UI.
  const exportQuery = new URLSearchParams();
  if (params.q) exportQuery.set("q", params.q);
  if (params.status) exportQuery.set("status", params.status);

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
          <a href={`/api/admin/products/export?${exportQuery.toString()}`}>
            <Button variant="outline" size="md" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </a>
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

      {/* Filters — plain links, so a filtered view is a shareable URL. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.map((filter) => {
          const query = new URLSearchParams();
          if (params.q) query.set("q", params.q);
          if (filter.value !== "all") query.set("status", filter.value);
          const href = query.toString() ? `/admin/products?${query}` : "/admin/products";

          return (
            <Link
              key={filter.value}
              href={href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeStatus === filter.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <p className="rounded-brand-xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
          Nothing here yet. Create a product, or import a spreadsheet to add many at once.
        </p>
      ) : (
        <ProductTable products={products} categories={categories} />
      )}
    </div>
  );
}
