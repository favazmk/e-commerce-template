import { IUserRepository } from "../interfaces/user.repository.interface";
import { User, UserRole } from "../../types/database";
import { SupabaseRepository } from "./base.repository";

export class SupabaseUserRepository extends SupabaseRepository implements IUserRepository {
  /**
   * Resolve the profile of the *signed-in* user.
   *
   * RLS-enforced: the "Users can view their own profile" policy means a bug in
   * the id passed here cannot surface somebody else's profile — the query
   * simply returns nothing. This backs `getSessionUser()` and therefore every
   * admin authorisation decision, so it is the single most important query in
   * the application to keep under RLS.
   */
  async findById(id: string): Promise<User | null> {
    const client = await this.userClient();
    const { data, error } = await client
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as User;
  }

  /**
   * Look up any profile by id, bypassing RLS.
   *
   * Reserved for admin screens and system flows that legitimately need to read
   * a customer other than the caller. Callers MUST already be authorised.
   */
  async findByIdAsService(id: string): Promise<User | null> {
    const { data, error } = await this.serviceClient("admin-authorised")
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as User;
  }

  // Email lookup is an administrative/system concern (there is no anon policy
  // that would allow searching the user table by email, by design).
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.serviceClient("no-anon-policy-by-design")
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) return null;
    return data as User;
  }

  // Profile rows are normally created by the handle_new_user() trigger; this
  // is the system path for seeding and back-fills.
  async create(user: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
    const { data, error } = await this.serviceClient("system-no-session")
      .from("users")
      .insert([user])
      .select()
      .single();

    if (error || !data) throw new Error("Failed to create user");
    return data as User;
  }

  // Role changes are privileged by definition and must never be reachable
  // through a customer session.
  async updateRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await this.serviceClient("admin-authorised")
      .from("users")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw new Error("Failed to update user role");
  }
}
