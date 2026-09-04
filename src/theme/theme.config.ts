export type ProductCardVariant =
  | "classic"
  | "minimal"
  | "luxury"
  | "modern"
  | "compact"
  | "image-focused";

export interface NavigationLink {
  label: string;
  href: string;
}

export interface ThemeConfig {
  brand: {
    name: string;
    logoUrl?: string;
    faviconUrl?: string;
    tagline?: string;
  };
  colors: {
    /** Primary action colour. One hot accent, reserved for CTAs. */
    primary: string;
    /** Deep neutral for secondary buttons, the footer and the header wordmark. */
    secondary: string;
    accent: string;
    /** Primary text. A dense blue-charcoal, not pure black. */
    ink: string;
    /** Secondary text: product names, helper copy. */
    mutedInk: string;
    surface: string;
    /** Section backgrounds and inactive chips. */
    subtle: string;
    muted: string;
    border: string;
    /** Ratings and in-stock states. */
    rating: string;
    /** Discount percentages and offer copy. */
    discount: string;
    /** Scarcity messaging. Deliberately distinct from `discount`. */
    urgent: string;
  };
  typography: {
    fontHeading: string;
    fontBody: string;
  };
  /**
   * Storefront navigation. Category slugs differ per client, so this belongs
   * in per-client theme configuration and never hard-coded into components.
   */
  navigation: NavigationLink[];
  styling: {
    borderRadius: string; // e.g. '4px', '8px', '0px'
    productCardVariant: ProductCardVariant;
    headerSticky: boolean;
    announcementBar: {
      enabled: boolean;
      text: string;
      link?: string;
    };
  };
}

/**
 * Default theme.
 *
 * The palette follows how high-volume fashion marketplaces are actually built —
 * dense ink text, a single hot accent for actions, green for ratings, orange
 * for discounts, red for scarcity. Those three semantic colours are near
 * universal in commerce, and shoppers read them before they read the words.
 *
 * Values are placeholders in the branding sense: every one is overridable per
 * client via environment variables or the client repository's theme
 * configuration (AGENTS.md sections 2, 9 and 25).
 */
export const defaultThemeConfig: ThemeConfig = {
  brand: {
    name: process.env.NEXT_PUBLIC_STORE_NAME || "Your Store",
    tagline: process.env.NEXT_PUBLIC_STORE_TAGLINE || undefined,
  },
  colors: {
    primary: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || "#f5325b",
    secondary: "#282c3f",
    accent: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || "#f5325b",
    ink: "#282c3f",
    mutedInk: "#696b79",
    surface: "#ffffff",
    subtle: "#f5f5f6",
    muted: "#fafafb",
    border: "#eaeaec",
    rating: "#14958f",
    discount: "#ff690f",
    urgent: "#ff5a5a",
  },
  typography: {
    fontHeading: "Figtree, Inter, sans-serif",
    fontBody: "Figtree, Inter, sans-serif",
  },
  navigation: [{ label: "Shop All", href: "/products" }],
  styling: {
    // Marketplace UI is squarer than the SaaS default; over-rounding every
    // surface is a large part of why a storefront reads as a template.
    borderRadius: "4px",
    productCardVariant: "luxury",
    headerSticky: true,
    announcementBar: {
      enabled: false,
      text: "",
      link: "/products",
    },
  },
};
