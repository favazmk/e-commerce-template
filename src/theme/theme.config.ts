export type ProductCardVariant =
  | "classic"
  | "minimal"
  | "luxury"
  | "modern"
  | "compact"
  | "image-focused";

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
    name: "AURA LUXURY",
    tagline: "Timeless Essentials & Artisanal Craft",
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
  styling: {
    borderRadius: "0.5rem",
    productCardVariant: "luxury",
    headerSticky: true,
    announcementBar: {
      enabled: true,
      text: "✨ Complimentary Global Express Courier on orders over $200",
      link: "/products",
    },
  },
};
