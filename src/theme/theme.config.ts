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
    primary: string;
    secondary: string;
    accent: string;
    surface: string;
    muted: string;
    border: string;
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
    borderRadius: string; // e.g. '0.5rem', '0.75rem', '0px'
    productCardVariant: ProductCardVariant;
    headerSticky: boolean;
    announcementBar: {
      enabled: boolean;
      text: string;
      link?: string;
    };
  };
}

export const defaultThemeConfig: ThemeConfig = {
  brand: {
    // Placeholder values only. Override per client via environment variables
    // or the client repository's theme configuration (AGENTS.md sections 2, 9).
    name: process.env.NEXT_PUBLIC_STORE_NAME || "Your Store",
    tagline: process.env.NEXT_PUBLIC_STORE_TAGLINE || undefined,
  },
  colors: {
    primary: "#0f172a", // Slate 900
    secondary: "#334155", // Slate 700
    accent: "#10b981", // Emerald 500
    surface: "#ffffff",
    muted: "#f8fafc",
    border: "#e2e8f0",
  },
  typography: {
    fontHeading: "Outfit, Inter, sans-serif",
    fontBody: "Inter, sans-serif",
  },
  navigation: [{ label: "Shop All", href: "/products" }],
  styling: {
    borderRadius: "0.5rem",
    productCardVariant: "luxury",
    headerSticky: true,
    announcementBar: {
      enabled: false,
      text: "",
      link: "/products",
    },
  },
};
