"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Mail, CheckCircle2 } from "lucide-react";
import { Category, HomepageSection, Product } from "@/types/database";
import { ProductCard } from "../ProductCard";
import { Button } from "@/components/ui/button";
import { SafeImage } from "../ProductImage";

export function DynamicSectionRenderer({
  sections,
  categories,
  featuredProducts,
}: {
  sections: HomepageSection[];
  categories: Category[];
  featuredProducts: Product[];
}) {
  // Block, not flex-column: a flex item with `mx-auto` sizes to its content
  // instead of stretching, which collapsed every `max-w-7xl mx-auto` section to
  // a few hundred pixels wide. `space-y-*` stacks these just as well.
  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
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
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-brand-ink text-white">
      {/* Background Image with Gradient Overlay */}
      {section.image_url && (
        <div className="absolute inset-0 z-0">
          <SafeImage
            priority
            sizes="100vw"
            src={section.image_url}
            alt=""
            className="h-full w-full object-cover object-center opacity-40 scale-105 animate-in fade-in zoom-in duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/40 to-transparent" />
        </div>
      )}

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Badge, primary and secondary actions below are all defined against
            the dark hero surface rather than the palette: with a monochrome
            brand the primary colour equals the hero background, so brand-tinted
            controls here render black on black. */}
        {content.badge && (
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-widest text-white bg-white/10 border border-white/25 rounded-full">
            {content.badge}
          </span>
        )}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white font-heading max-w-4xl mx-auto leading-[1.1]">
          {section.title || "Timeless Craftsmanship"}
        </h1>
        {section.subtitle && (
          <p className="mt-6 text-lg sm:text-xl text-brand-faint-ink max-w-2xl mx-auto font-light leading-relaxed">
            {section.subtitle}
          </p>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={content.ctaLink || "/products"}>
            <Button size="lg" variant="inverse" className="w-full sm:w-auto px-8 gap-2 shadow-lg">
              {content.ctaText || "Shop Collection"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {content.secondaryCtaText && (
            <Link href={content.secondaryCtaLink || "/categories/luxury-apparel"}>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white"
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
        <h2 className="text-3xl font-bold text-brand-ink font-heading">
          {section.title || "Shop by Category"}
        </h2>
        {section.subtitle && (
          <p className="mt-2 text-sm text-brand-muted-ink">{section.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group relative overflow-hidden rounded-brand-xl aspect-[4/5] bg-brand-subtle shadow-subtle hover:shadow-float transition-all duration-500"
          >
            <SafeImage
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              src={cat.image_url}
              alt=""
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/80 via-brand-ink/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h3 className="text-xl font-bold font-heading">{cat.name}</h3>
              <p className="mt-1 text-xs text-brand-faint-ink line-clamp-1">{cat.description}</p>
              <span className="mt-3 inline-flex items-center text-xs font-semibold text-brand-primary gap-1 group-hover:translate-x-1 transition-transform">
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
          <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">
            Handpicked Curations
          </span>
          <h2 className="text-3xl font-bold text-brand-ink font-heading mt-1">
            {section.title || "Featured Essentials"}
          </h2>
          {section.subtitle && (
            <p className="mt-2 text-sm text-brand-muted-ink max-w-lg">{section.subtitle}</p>
          )}
        </div>
        <Link
          href="/products"
          className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-primary transition-colors"
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
      <div className="relative overflow-hidden rounded-brand-xl bg-brand-ink text-white min-h-[420px] flex items-center">
        {section.image_url && (
          <div className="absolute inset-0 z-0">
            <SafeImage
              sizes="100vw"
              src={section.image_url}
              alt=""
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/70 to-transparent" />
          </div>
        )}
        <div className="relative z-10 max-w-xl p-8 sm:p-14">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">
            Master Craftsmanship
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading mt-2 leading-tight">
            {section.title || "Sustainable Elegance, Zero Compromise"}
          </h2>
          {section.subtitle && (
            <p className="mt-4 text-sm sm:text-base text-brand-faint-ink font-light">
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
    <section className="bg-brand-subtle/70 py-20 border-y border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-brand-ink font-heading">
          {section.title || "Client Praise"}
        </h2>
        {section.subtitle && (
          <p className="mt-2 text-sm text-brand-muted-ink max-w-md mx-auto">{section.subtitle}</p>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {reviews.map((rev: any, i: number) => (
            <div
              key={i}
              className="rounded-brand-xl bg-white p-8 shadow-subtle border border-brand-border text-left flex flex-col justify-between"
            >
              <div className="flex text-brand-rating mb-4">
                {[...Array(rev.rating || 5)].map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-brand-muted-ink italic leading-relaxed">&ldquo;{rev.quote}&rdquo;</p>
              <div className="mt-6 pt-4 border-t border-brand-border">
                <h4 className="text-sm font-bold text-brand-ink">{rev.author}</h4>
                <p className="text-xs text-brand-muted-ink">{rev.title}</p>
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
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  // Set NEXT_PUBLIC_NEWSLETTER_ENDPOINT to the client's list provider.
  const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address || !endpoint) return;

    setIsSending(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address }),
      });
      if (!res.ok) throw new Error("Subscription failed");
      setSubscribed(true);
      setEmail("");
    } catch {
      // Do not claim success when the request did not succeed.
      setError("We could not sign you up just now. Please try again later.");
    } finally {
      setIsSending(false);
    }
  };

  // No configured provider means there is nowhere to send the address, so the
  // form would be decorative. Render the copy without a misleading input.
  if (!endpoint) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="rounded-brand-xl bg-brand-ink text-white p-8 sm:p-14 shadow-float">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary mx-auto mb-4 border border-brand-primary/20">
          <Mail className="h-6 w-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-heading">
          {section.title || "Join our mailing list"}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-brand-faint-ink max-w-md mx-auto">
          {section.subtitle || "Get new arrivals and offers straight to your inbox."}
        </p>

        {subscribed ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-brand-primary text-sm font-semibold">
            <CheckCircle2 className="h-5 w-5" /> Thanks for subscribing.
          </div>
        ) : (
          <>
          {error && (
            <p role="alert" className="mt-4 text-xs font-medium text-brand-danger">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="min-w-0 flex-1 rounded-brand bg-brand-ink border border-brand-ink/50 px-4 py-3 text-sm text-white placeholder-brand-faint-ink focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <Button type="submit" variant="accent" size="md" isLoading={isSending}>
              Subscribe
            </Button>
          </form>
          </>
        )}
      </div>
    </section>
  );
}
