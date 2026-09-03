import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/security/safe-redirect";

/**
 * Supabase auth callback.
 *
 * Every email-based auth flow lands here: sign-up confirmation, magic link,
 * password recovery and (if enabled) OAuth. Supabase sends the browser to
 * `/auth/callback?code=...`, and this route exchanges that one-time code for a
 * session cookie set on our own domain.
 *
 * Why a server route rather than handling it client-side: the exchange writes
 * an httpOnly session cookie. Doing it in the browser would mean the tokens
 * pass through client JavaScript, where any XSS could read them.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  // `next` is caller-controlled, so it goes through the open-redirect guard.
  const next = safeRedirectPath(searchParams.get("next"), "/account");

  // Supabase reports failures as query params rather than an HTTP error.
  const errorCode = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorCode) {
    const failure = new URL("/login", origin);
    failure.searchParams.set(
      "error",
      // The link is usually just expired; say that rather than echoing raw
      // provider text back into the page.
      errorDescription?.toLowerCase().includes("expired")
        ? "This link has expired. Please request a new one."
        : "We could not complete that sign-in. Please try again."
    );
    return NextResponse.redirect(failure);
  }

  if (!code) {
    const failure = new URL("/login", origin);
    failure.searchParams.set("error", "That link is not valid. Please request a new one.");
    return NextResponse.redirect(failure);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Code exchange failed:", error.message);
    const failure = new URL("/login", origin);
    failure.searchParams.set(
      "error",
      "That link has already been used or has expired. Please request a new one."
    );
    return NextResponse.redirect(failure);
  }

  return NextResponse.redirect(new URL(next, origin));
}
