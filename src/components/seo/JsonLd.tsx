import React from "react";

/**
 * Serialise structured data for embedding in a <script> tag.
 *
 * Product names and review text are merchant- and customer-supplied, so they
 * reach this function as untrusted input. `JSON.stringify` alone is not safe
 * inside an HTML script element: the tokeniser treats the element's content as
 * raw text, so a value containing "</script>" closes the tag early and
 * everything after it is parsed as markup — stored XSS on every product page,
 * reachable by anyone who can submit a review.
 *
 * Escaping the characters below as unicode sequences keeps the payload valid
 * JSON — it parses back byte-for-byte — while making tag breakout impossible.
 */

/**
 * A single backslash, built from its character code.
 *
 * Written this way deliberately. The first version of this file used string
 * literals like "\\u003c"; a formatting pass collapsed the double backslash to
 * a single one, which JavaScript then read as the literal "<" — turning every
 * replacement into a no-op and silently reopening the XSS hole. A diff would
 * not have shown anything obviously wrong. There is no ambiguous escape here.
 */
const BACKSLASH = String.fromCharCode(92);

/** Render one character as a JSON unicode escape, e.g. "<" -> backslash-u003c. */
function unicodeEscape(character: string): string {
  return BACKSLASH + "u" + character.charCodeAt(0).toString(16).padStart(4, "0");
}

/**
 * Characters that must never appear raw:
 *   <  >   close and open HTML tags
 *   &      begins an HTML entity
 *   U+2028 / U+2029  are legal JSON but terminate a JavaScript string literal,
 *                    so an inline script containing them fails to parse
 */
const UNSAFE_JSON_LD_CHARS = new RegExp(
  "[<>&" + String.fromCharCode(0x2028) + String.fromCharCode(0x2029) + "]",
  "g"
);

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE_JSON_LD_CHARS, unicodeEscape);
}

export interface JsonLdProps {
  /** One schema.org object, or several to emit as separate blocks. */
  data: unknown | unknown[];
}

/**
 * Renders schema.org JSON-LD for search engines. Invisible to users.
 *
 * `dangerouslySetInnerHTML` is required here and is safe: a <script> element's
 * content is raw text, so React's normal JSX escaping would insert HTML
 * entities that break JSON parsing. The escaping that actually protects this
 * is `serializeJsonLd` above, which is covered by tests in tests/seo.test.ts.
 */
export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
        />
      ))}
    </>
  );
}
