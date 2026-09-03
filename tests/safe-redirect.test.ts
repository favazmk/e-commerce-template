import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "../src/lib/security/safe-redirect";

/**
 * Open-redirect guard.
 *
 * These are not stylistic assertions. A `?redirectTo=` that accepts an absolute
 * URL turns the store's own login page into a credible phishing landing page:
 * the victim sees the real domain in the address bar the entire time they type
 * their password, then gets bounced to the attacker. Every case below is a
 * bypass that has worked against real implementations of this check.
 */
describe("safeRedirectPath", () => {
  it("keeps ordinary same-site paths", () => {
    expect(safeRedirectPath("/account/orders")).toBe("/account/orders");
    expect(safeRedirectPath("/products?category=shoes")).toBe("/products?category=shoes");
    expect(safeRedirectPath("/cart#summary")).toBe("/cart#summary");
  });

  it("falls back when nothing usable is supplied", () => {
    expect(safeRedirectPath(null)).toBe("/account");
    expect(safeRedirectPath(undefined)).toBe("/account");
    expect(safeRedirectPath("")).toBe("/account");
    expect(safeRedirectPath("   ")).toBe("/account");
  });

  it("rejects absolute URLs", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/account");
    expect(safeRedirectPath("http://evil.example/login")).toBe("/account");
    expect(safeRedirectPath("//evil.example")).toBe("/account");
  });

  it("rejects protocol-relative URLs disguised with a backslash", () => {
    // Browsers normalise "\" to "/" inside a URL, so "/\evil.example" resolves
    // to "//evil.example" — a different origin that startsWith("/") permits.
    expect(safeRedirectPath("/\\evil.example")).toBe("/account");
    expect(safeRedirectPath("/\\/evil.example")).toBe("/account");
  });

  it("rejects javascript and data schemes however they are encoded", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/account");
    expect(safeRedirectPath("/javascript:alert(1)")).toBe("/account");
    expect(safeRedirectPath("/%6a%61%76%61%73%63%72%69%70%74:alert(1)")).toBe("/account");
    expect(safeRedirectPath("data:text/html,<script>alert(1)</script>")).toBe("/account");
  });

  it("rejects control characters used to smuggle a scheme past a naive check", () => {
    // Built from char codes rather than written literally, so the payload
    // survives editors and formatters that would strip a raw control byte.
    const tab = String.fromCharCode(0x09);
    const newline = String.fromCharCode(0x0a);
    const nul = String.fromCharCode(0x00);

    expect(safeRedirectPath(`/${tab}//evil.example`)).toBe("/account");
    expect(safeRedirectPath(`/${newline}//evil.example`)).toBe("/account");
    expect(safeRedirectPath(`/account${nul}`)).toBe("/account");
  });

  it("rejects malformed percent-encoding rather than passing it through", () => {
    expect(safeRedirectPath("/%E0%A4%A")).toBe("/account");
  });

  it("never bounces a signed-in customer back to an auth screen", () => {
    // Otherwise: sign in, land on the sign-in page, sign in again, forever.
    expect(safeRedirectPath("/login")).toBe("/account");
    expect(safeRedirectPath("/register?foo=1")).toBe("/account");
    expect(safeRedirectPath("/reset-password")).toBe("/account");
    expect(safeRedirectPath("/auth/callback")).toBe("/account");
  });

  it("honours a custom fallback", () => {
    expect(safeRedirectPath("https://evil.example", "/")).toBe("/");
  });
});
