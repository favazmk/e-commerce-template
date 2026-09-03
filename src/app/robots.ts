import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexable } from "@/lib/seo/site";

/**
 * robots.txt served at /robots.txt.
 *
 * Two jobs: keep crawlers out of pages that must never be indexed (account,
 * checkout, admin, API, and any URL carrying a session or token), and point
 * them at the sitemap. Preview and demo deployments disallow everything so a
 * staging copy can never outrank or duplicate the live store.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  const disallow = [
    "/admin",
    "/admin/",
    "/api/",
    "/account",
    "/account/",
    "/checkout",
    "/checkout/",
    "/cart",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/",
    // Faceted-navigation parameters create near-infinite duplicate URLs.
    "/*?*sort=",
    "/*?*page=",
    "/*?*brand=",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        // Aggressive SEO crawlers add load without sending customers.
        userAgent: ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot"],
        disallow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
