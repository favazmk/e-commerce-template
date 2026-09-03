import type { MetadataRoute } from "next";
import { getStoreDisplayName } from "@/lib/config/store.config";
import { getStoreDescription } from "@/lib/seo/site";

/**
 * PWA manifest served at /manifest.webmanifest.
 *
 * Makes the storefront installable on Android/iOS home screens and gives
 * Chrome the theme colour for the browser chrome. Icons fall back to the
 * bundled logo so a client that has not supplied artwork still gets a valid
 * manifest rather than a broken one.
 */
export default function manifest(): MetadataRoute.Manifest {
  const name = getStoreDisplayName();
  const themeColor = process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR?.trim() || "#0f172a";
  const icon = process.env.NEXT_PUBLIC_STORE_ICON_URL?.trim() || "/logo.svg";

  return {
    name,
    short_name: name.length > 12 ? name.slice(0, 12) : name,
    description: getStoreDescription(),
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: themeColor,
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: icon, sizes: "any", type: icon.endsWith(".svg") ? "image/svg+xml" : "image/png" },
      ...(process.env.NEXT_PUBLIC_STORE_ICON_192
        ? [{ src: process.env.NEXT_PUBLIC_STORE_ICON_192, sizes: "192x192", type: "image/png" as const, purpose: "any" as const }]
        : []),
      ...(process.env.NEXT_PUBLIC_STORE_ICON_512
        ? [{ src: process.env.NEXT_PUBLIC_STORE_ICON_512, sizes: "512x512", type: "image/png" as const, purpose: "maskable" as const }]
        : []),
    ],
  };
}
