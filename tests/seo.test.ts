import { beforeEach, describe, expect, it } from "vitest";
import { serializeJsonLd } from "../src/components/seo/JsonLd";

/**
 * Structured-data serialisation.
 *
 * Product names, review text and merchant descriptions all end up inside a
 * <script type="application/ld+json"> block. That block is parsed as raw text
 * by the HTML tokeniser, so an unescaped "</script>" in any of that content
 * closes the tag early and everything after it becomes live markup — stored
 * XSS on every product page, reachable by anyone who can submit a review.
 */
describe("serializeJsonLd", () => {
  it("produces valid JSON for ordinary content", () => {
    const data = { "@type": "Product", name: "Linen Shirt", price: 199.99 };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("escapes a script-closing tag so it cannot break out", () => {
    const serialized = serializeJsonLd({
      name: "Nice product</script><script>alert(document.cookie)</script>",
    });

    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<script");
    // Still parses back to the exact original string — escaped, not mangled.
    expect(JSON.parse(serialized).name).toBe(
      "Nice product</script><script>alert(document.cookie)</script>"
    );
  });

  it("escapes angle brackets and ampersands", () => {
    const serialized = serializeJsonLd({ name: "<b>Bold</b> & bright" });
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(JSON.parse(serialized).name).toBe("<b>Bold</b> & bright");
  });

  it("escapes line separators that break JavaScript string parsing", () => {
    const lineSeparator = String.fromCharCode(0x2028);
    const paragraphSeparator = String.fromCharCode(0x2029);
    const serialized = serializeJsonLd({ name: `a${lineSeparator}b${paragraphSeparator}c` });

    expect(serialized).not.toContain(lineSeparator);
    expect(serialized).not.toContain(paragraphSeparator);
    expect(JSON.parse(serialized).name).toBe(`a${lineSeparator}b${paragraphSeparator}c`);
  });
});

describe("SEO site helpers", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_MODE;
    delete process.env.NEXT_PUBLIC_ALLOW_INDEXING;
    delete process.env.VERCEL_ENV;
  });

  it("builds absolute URLs from the configured origin", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.com/";
    const { absoluteUrl } = await import("../src/lib/seo/site");

    expect(absoluteUrl("/products")).toBe("https://shop.example.com/products");
    expect(absoluteUrl("products")).toBe("https://shop.example.com/products");
    expect(absoluteUrl("/")).toBe("https://shop.example.com/");
  });

  it("strips the query string from canonical URLs", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.com";
    const { canonicalUrl } = await import("../src/lib/seo/site");

    // Faceted variants must consolidate onto one canonical, or every filter
    // combination competes with the page it is a variant of.
    expect(canonicalUrl("/products?sort=price_asc&page=3")).toBe(
      "https://shop.example.com/products"
    );
  });

  it("refuses to mark a demo deployment as indexable", async () => {
    process.env.NEXT_PUBLIC_APP_MODE = "demo";
    const { isIndexable } = await import("../src/lib/seo/site");
    expect(isIndexable()).toBe(false);
  });

  it("refuses to mark a Vercel preview as indexable", async () => {
    // A staging copy in the index splits ranking signals with the live store.
    process.env.VERCEL_ENV = "preview";
    const { isIndexable } = await import("../src/lib/seo/site");
    expect(isIndexable()).toBe(false);
  });

  it("honours an explicit opt-out on production", async () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_ALLOW_INDEXING = "false";
    const { isIndexable } = await import("../src/lib/seo/site");
    expect(isIndexable()).toBe(false);
  });
});
