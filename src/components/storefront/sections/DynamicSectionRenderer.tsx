"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Mail, CheckCircle2 } from "lucide-react";
import { Category, HomepageSection, Product } from "@/types/database";
import { ProductCard } from "../ProductCard";
import { Button } from "@/components/ui/button";

export function DynamicSectionRenderer({
  sections,
  categories,
  featuredProducts,
}: {
  sections: HomepageSection[];
  categories: Category[];
  featuredProducts: Product[];
}) {
  return (
    <div className="flex flex-col space-y-16 sm:space-y-24 pb-20">
      {sections
        .filter((s) => s.is_enabled)
        .sort((a, b) => a.display_order - b.display_order)
        .map((section) => {
          switch (section.section_type) {
            case "hero":
              return <HeroSection key={section.id} section={section} />;
            case "categories":
              return (
                <CategoriesSection
                  key={section.id}
                  section={section}
                  categories={categories}
                />
              );
            case "featured_products":
              return (
                <FeaturedProductsSection
                  key={section.id}
                  section={section}
                  products={featuredProducts}
                />
              );
            case "banner":
              return <BannerSection key={section.id} section={section} />;
            case "testimonials":
              return <TestimonialsSection key={section.id} section={section} />;
            case "newsletter":
              return <NewsletterSection key={section.id} section={section} />;
            default:
              return null;
          }
        })}
    </div>
  );
}

function HeroSection({ section }: { section: HomepageSection }) {
  const content = section.content || {};
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
      {/* Background Image with Gradient Overlay */}
      {section.image_url && (
        <div className="absolute inset-0 z-0">
          <img
            src={section.image_url}
            alt={section.title || "Hero Banner"}
            className="h-full w-full object-cover object-center opacity-40 scale-105 animate-in fade-in zoom-in duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>
      )}

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {content.badge && (
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-full">
            {content.badge}
          </span>
        )}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white font-heading max-w-4xl mx-auto leading-[1.1]">
          {section.title || "Timeless Craftsmanship"}
        </h1>
        {section.subtitle && (
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            {section.subtitle}
          </p>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={content.ctaLink || "/products"}>
            <Button size="lg" variant="accent" className="w-full sm:w-auto px-8 gap-2 shadow-lg">
              {content.ctaText || "Shop Collection"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {content.secondaryCtaText && (
            <Link href={content.secondaryCtaLink || "/categories/luxury-apparel"}>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10 hover:text-white"
              >
                {content.secondaryCtaText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoriesSection({
  section,
  categories,
}: {
  section: HomepageSection;
  categories: Category[];
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="text-center max-w-xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-slate-900 font-heading">
          {section.title || "Shop by Category"}
        </h2>
        {section.subtitle && (
          <p className="mt-2 text-sm text-slate-500">{section.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group relative overflow-hidden rounded-brand-xl aspect-[4/5] bg-slate-100 shadow-subtle hover:shadow-float transition-all duration-500"
          >
            {cat.image_url && (
              <img
                src={cat.image_url}
                alt={cat.name}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h3 className="text-xl font-bold font-heading">{cat.name}</h3>
              <p className="mt-1 text-xs text-slate-300 line-clamp-1">{cat.description}</p>
              <span className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-400 gap-1 group-hover:translate-x-1 transition-transform">
                Explore Category <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturedProductsSection({
  section,
  products,
}: {
  section: HomepageSection;
  products: Product[];
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Handpicked Curations
          </span>
          <h2 className="text-3xl font-bold text-slate-900 font-heading mt-1">
            {section.title || "Featured Essentials"}
          </h2>
          {section.subtitle && (
            <p className="mt-2 text-sm text-slate-500 max-w-lg">{section.subtitle}</p>
          )}
        </div>
        <Link
          href="/products"
          className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-emerald-600 transition-colors"
        >
          View All Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} variant="luxury" />
        ))}
      </div>
    </section>
  );
}

function BannerSection({ section }: { section: HomepageSection }) {
  const content = section.content || {};
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-brand-xl bg-slate-900 text-white min-h-[420px] flex items-center">
        {section.image_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={section.image_url}
              alt="Promotional Banner"
              className="h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
          </div>
        )}
        <div className="relative z-10 max-w-xl p-8 sm:p-14">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Master Craftsmanship
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading mt-2 leading-tight">
            {section.title || "Sustainable Elegance, Zero Compromise"}
          </h2>
          {section.subtitle && (
            <p className="mt-4 text-sm sm:text-base text-slate-300 font-light">
              {section.subtitle}
            </p>
          )}
          <div className="mt-8">
            <Link href={content.ctaLink || "/products"}>
              <Button variant="accent" size="md">
                {content.ctaText || "Discover The Craft"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ section }: { section: HomepageSection }) {
  const reviews = section.content?.reviews || [];
  return (
    <section className="bg-slate-50/70 py-20 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 font-heading">
          {section.title || "Client Praise"}
        </h2>
        {section.subtitle && (
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{section.subtitle}</p>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {reviews.map((rev: any, i: number) => (
            <div
              key={i}
              className="rounded-brand-xl bg-white p-8 shadow-subtle border border-slate-100 text-left flex flex-col justify-between"
            >
              <div className="flex text-amber-400 mb-4">
                {[...Array(rev.rating || 5)].map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">&ldquo;{rev.quote}&rdquo;</p>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">{rev.author}</h4>
                <p className="text-xs text-slate-500">{rev.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection({ section }: { section: HomepageSection }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="rounded-brand-xl bg-slate-900 text-white p-8 sm:p-14 shadow-float">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 mx-auto mb-4 border border-emerald-800/60">
          <Mail className="h-6 w-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-heading">
          {section.title || "Join the Collector's Circle"}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          {section.subtitle || "Receive private invitations, archive previews, and complimentary delivery on your first order."}
        </p>

        {subscribed ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="h-5 w-5" /> Thank you for subscribing to our private list.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 rounded-brand bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button type="submit" variant="accent" size="md">
              Subscribe
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
