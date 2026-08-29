import React from "react";
import Link from "next/link";
import { CategoryService } from "@/services/category.service";
import { ProductService } from "@/services/product.service";
import { ProductCard } from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import { SlidersHorizontal, ShoppingBag } from "lucide-react";

export interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    brand?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const searchQuery = params.q;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const brand = params.brand;
  const inStockOnly = params.inStock === "true";
  const sortBy = (params.sort as any) || "newest";
  const page = params.page ? Number(params.page) : 1;

  const categories = await CategoryService.getCategories(true);
  const currentCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  const { items: products, total, totalPages } = await ProductService.getProducts({
    categorySlug,
    searchQuery,
    minPrice,
    maxPrice,
    brand,
    inStockOnly,
    sortBy,
    page,
    limit: 12,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Page Header & Breadcrumb */}
      <div className="mb-10">
        <nav className="flex text-xs text-slate-500 mb-3 space-x-2">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-slate-900 transition-colors">
            Collections
          </Link>
          {currentCategory && (
            <>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{currentCategory.name}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">
              {currentCategory ? currentCategory.name : searchQuery ? `Search: "${searchQuery}"` : "All Collections"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              {currentCategory
                ? currentCategory.description
                : "Discover our comprehensive gallery of artisanal garments, footwear, and curated lifestyle essentials."}
            </p>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="text-slate-900 font-bold">{products.length}</span> of {total} products
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block space-y-8">
          {/* Categories List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Categories
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products"
                  className={`block py-1.5 transition-colors ${
                    !categorySlug ? "font-bold text-emerald-600" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Products
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className={`block py-1.5 transition-colors ${
                      categorySlug === cat.slug
                        ? "font-bold text-emerald-600"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Filters */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Price Range
            </h3>
            <div className="space-y-2 text-sm">
              <Link
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}maxPrice=200`}
                className="block text-slate-600 hover:text-slate-900 py-1"
              >
                Under $200
              </Link>
              <Link
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}minPrice=200&maxPrice=400`}
                className="block text-slate-600 hover:text-slate-900 py-1"
              >
                $200 – $400
              </Link>
              <Link
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}minPrice=400`}
                className="block text-slate-600 hover:text-slate-900 py-1"
              >
                $400 & Above
              </Link>
            </div>
          </div>

          {/* Sort Presets */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Sort Order
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "Newest Releases", value: "newest" },
                { label: "Price: Low to High", value: "price_asc" },
                { label: "Price: High to Low", value: "price_desc" },
                { label: "Featured Picks", value: "featured" },
              ].map((s) => (
                <Link
                  key={s.value}
                  href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}sort=${s.value}`}
                  className={`block py-1 ${
                    sortBy === s.value ? "font-bold text-emerald-600" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No products match your criteria"
              description="Try adjusting your filters or search keywords to discover available items."
              actionText="Reset Filters"
              actionHref="/products"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant="luxury" />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center space-x-2 border-t border-slate-100 pt-8">
              {[...Array(totalPages)].map((_, i) => {
                const pNum = i + 1;
                return (
                  <Link
                    key={pNum}
                    href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}page=${pNum}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-brand text-sm font-semibold transition-colors ${
                      page === pNum
                        ? "bg-brand-primary text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {pNum}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
