import React from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { Analytics } from "@/components/storefront/Analytics";
import { CookieConsent } from "@/components/storefront/CookieConsent";
import { JsonLd } from "@/components/seo/JsonLd";
import { CategoryService } from "@/services/category.service";
import { SettingsService } from "@/services/settings.service";
import { StoreFeaturesProvider } from "@/features/settings/StoreFeaturesContext";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Navigation reflects the real catalog rather than hard-coded slugs.
  const categories = await CategoryService.getCategories(true);
  const navCategories = categories.map((c) => ({ name: c.name, slug: c.slug }));

  // Feature switches are read once here and handed to the tree, so a client
  // component can hide a feature without fetching its own copy.
  const features = await SettingsService.getStoreFeatures();

  return (
    <StoreFeaturesProvider features={features}>
      {/* Site-wide entity markup. Emitted once at the layout so every page
          carries it, and referenced by @id from the per-page Product and
          Breadcrumb blocks rather than being repeated. */}
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

      <div className="flex min-h-screen flex-col justify-between">
        <Header categories={navCategories} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer categories={navCategories} />
        <Analytics />
        <CookieConsent />
      </div>
    </StoreFeaturesProvider>
  );
}
