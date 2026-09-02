import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RepositoryFactory } from "@/repositories/repository.factory";
import { User, UserRole } from "@/types/database";

const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];

/**
 * Resolve the authenticated user from the request session cookie.
 *
 * This is the ONLY trusted source of identity on the server. Never derive a
 * user id from a request header, query string or JSON body — those are fully
 * attacker controlled.
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const repo = RepositoryFactory.getUserRepository();
  return await repo.findById(user.id);
}

/**
 * Resolve the authenticated user id, or undefined for genuine guest traffic.
 */
export async function getSessionUserId(): Promise<string | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id;
}

export function isAdmin(user: User | null): boolean {
  return Boolean(user && ADMIN_ROLES.includes(user.role));
}

export interface AuthGuardFailure {
  response: NextResponse;
}

/**
 * Guard for privileged (merchant/admin) API routes.
 *
 * Returns `{ user }` when the caller is an authenticated admin, otherwise
 * returns `{ response }` holding the error to return from the route handler.
 * Route handlers must return that response immediately.
 */
export async function requireAdmin(): Promise<
  { user: User; response?: never } | { user?: never; response: NextResponse }
> {
  const user = await getSessionUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
        { status: 401 }
      ),
    };
  }

  if (!isAdmin(user)) {
    return {
      response: NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Administrator privileges required" } },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Guard for routes that require any signed-in customer.
 */
export async function requireUser(): Promise<
  { user: User; response?: never } | { user?: never; response: NextResponse }
> {
  const user = await getSessionUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
        { status: 401 }
      ),
    };
  }

  return { user };
}
