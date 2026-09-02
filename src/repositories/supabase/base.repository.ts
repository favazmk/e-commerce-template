import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "../../lib/supabase/server";

/**
 * Why a repository must choose its database client explicitly.
 *
 * Supabase offers two server-side clients:
 *
 *   - the **user-scoped** client (anon key + the caller's session cookie), where
 *     PostgreSQL Row Level Security decides what the query can see; and
 *   - the **service-role** client, which bypasses RLS entirely.
 *
 * Using the service-role client everywhere means RLS never runs, so the policies
 * in `supabase/migrations/` protect nothing against application bugs — a wrong
 * `.eq('user_id', ...)` silently returns another customer's data.
 *
 * Every repository therefore extends this base and states, per query, which
 * client it wants. `serviceClient()` takes a mandatory written justification so
 * that each bypass is a deliberate, reviewable decision rather than a default.
 */

/** Reasons a query may legitimately bypass Row Level Security. */
export type ServiceRoleJustification =
  /** Runs with no session at all (payment webhooks, background work). */
  | "system-no-session"
  /** Caller is already authorised as an admin by `requireAdmin()`. */
  | "admin-authorised"
  /** Public catalog data rendered in a cached/ISR context, where reading
   *  cookies would force the route dynamic. The service layer filters. */
  | "public-catalog-cached"
  /** Guest-owned records keyed by an unguessable token rather than a user id,
   *  which RLS cannot express (`auth.uid()` is null for guests). */
  | "guest-capability-token"
  /** Deliberately locked-down tables with no anon policy by design. */
  | "no-anon-policy-by-design";

export abstract class SupabaseRepository {
  /**
   * RLS-enforced client bound to the caller's session.
   *
   * Only valid inside a request scope (Server Component, Route Handler, Server
   * Action). It never falls back to the service role: a fallback would restore
   * the exact bypass this class exists to prevent.
   */
  protected async userClient(): Promise<SupabaseClient> {
    try {
      return (await createClient()) as unknown as SupabaseClient;
    } catch (error) {
      throw new Error(
        "A user-scoped database client was requested outside a request scope. " +
          "This query is RLS-enforced by design and must not be run without a session. " +
          `Underlying error: ${(error as Error)?.message ?? String(error)}`
      );
    }
  }

  /**
   * RLS-bypassing client. The `why` argument is required so that every bypass
   * carries its rationale at the call site.
   */
  protected serviceClient(why: ServiceRoleJustification): SupabaseClient {
    void why; // documentation-by-signature; kept for reviewers and greps
    return createAdminClient() as unknown as SupabaseClient;
  }
}
