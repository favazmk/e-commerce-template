import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Environment is loaded globally via tests/setupEnv.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * The most consequential authorisation test in the suite.
 *
 * `getSessionUser()` reads `users.role` and every admin gate in the application
 * — requireAdmin(), the middleware role check, the whole admin panel — trusts
 * it. NEXT_PUBLIC_SUPABASE_ANON_KEY is in the browser bundle by design, so a
 * signed-in customer holds a valid session JWT and can call PostgREST directly:
 *
 *     PATCH /rest/v1/users?id=eq.<their own id>
 *     { "role": "super_admin" }
 *
 * Row Level Security decides which ROWS a statement may touch; it cannot
 * restrict which COLUMNS. The original policy —
 * `FOR UPDATE USING (auth.uid() = id)` with no WITH CHECK — happily permits
 * that write, because the row still belongs to the caller afterwards.
 *
 * `supabase/migrations/20260105000000_privilege_escalation_fix.sql` closes it
 * with column-level privileges plus a BEFORE UPDATE trigger. These tests fail
 * loudly until that migration has been applied.
 */
describe("Integration: SECURITY — customers cannot escalate their own privileges", () => {
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const password = `Test-${Math.random().toString(36).slice(2)}-A1!`;
  const email = `escalation-probe-${Date.now()}@example.test`;

  let userId: string;
  let customerClient: SupabaseClient;

  beforeAll(async () => {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Escalation Probe" },
    });
    if (error || !data.user) throw new Error(`Could not create probe user: ${error?.message}`);
    userId = data.user.id;

    // The handle_new_user() trigger creates the public profile row; give it a
    // moment, then make sure the row exists before probing it.
    await adminClient
      .from("users")
      .upsert({ id: userId, email, name: "Escalation Probe", role: "customer" }, { onConflict: "id" });

    // A genuine customer session — exactly what a real shopper's browser holds.
    customerClient = createClient(supabaseUrl, anonKey);
    const { error: signInError } = await customerClient.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(`Could not sign in probe user: ${signInError.message}`);
  });

  afterAll(async () => {
    if (userId) {
      await adminClient.from("users").delete().eq("id", userId);
      await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    }
  });

  it("SECURITY: a customer cannot promote themselves to super_admin", async () => {
    await customerClient.from("users").update({ role: "super_admin" }).eq("id", userId);

    // Read back with the service role: what matters is the stored value, not
    // whether PostgREST returned an error. A silently-ignored write is fine;
    // a persisted role change is a total compromise.
    const { data } = await adminClient.from("users").select("role").eq("id", userId).single();

    expect(data?.role).toBe("customer");
  });

  it("SECURITY: a customer cannot promote themselves to admin", async () => {
    await customerClient.from("users").update({ role: "admin" }).eq("id", userId);

    const { data } = await adminClient.from("users").select("role").eq("id", userId).single();
    expect(data?.role).toBe("customer");
  });

  it("SECURITY: a role change smuggled alongside a legitimate edit is ignored", async () => {
    // The realistic attack: the client library echoes the whole row back, so
    // the payload looks like an ordinary profile save.
    await customerClient
      .from("users")
      .update({ name: "Legitimate Name Change", role: "staff" })
      .eq("id", userId);

    const { data } = await adminClient
      .from("users")
      .select("role, name")
      .eq("id", userId)
      .single();

    expect(data?.role).toBe("customer");
  });

  it("still allows a customer to edit their own name and phone", async () => {
    // The fix must not break the profile screen it protects.
    await customerClient
      .from("users")
      .update({ name: "Updated Name", phone: "+971500000000" })
      .eq("id", userId);

    const { data } = await adminClient
      .from("users")
      .select("name, phone")
      .eq("id", userId)
      .single();

    expect(data?.name).toBe("Updated Name");
    expect(data?.phone).toBe("+971500000000");
  });

  it("SECURITY: a customer cannot change the email their account signs in with", async () => {
    // The public profile email must track auth.users, which only the verified
    // email-change flow may move. Editing it here would desynchronise them.
    await customerClient.from("users").update({ email: "attacker@example.test" }).eq("id", userId);

    const { data } = await adminClient.from("users").select("email").eq("id", userId).single();
    expect(data?.email).toBe(email);
  });

  it("SECURITY: a customer cannot delete their profile row directly", async () => {
    // Account closure has to cascade into auth.users; a bare PostgREST DELETE
    // would leave an orphaned auth user that can still sign in.
    await customerClient.from("users").delete().eq("id", userId);

    const { data } = await adminClient.from("users").select("id").eq("id", userId).maybeSingle();
    expect(data?.id).toBe(userId);
  });

  it("still lets the service role promote a user — the admin flow depends on it", async () => {
    // Regression guard. The first version of the trigger used SECURITY DEFINER,
    // where `current_user` is the function OWNER rather than the caller — so
    // the service-role exemption never matched and the guard silently blocked
    // legitimate admin promotion as well as the attack. The symptom was an
    // admin being bounced to the homepage, with no error anywhere.
    await adminClient.from("users").update({ role: "admin" }).eq("id", userId);

    const { data: promoted } = await adminClient
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    expect(promoted?.role).toBe("admin");

    // And the customer still cannot escalate from the elevated state either.
    await customerClient.from("users").update({ role: "super_admin" }).eq("id", userId);
    const { data: after } = await adminClient
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    expect(after?.role).toBe("admin");

    // Put it back so later assertions in this file are not affected.
    await adminClient.from("users").update({ role: "customer" }).eq("id", userId);
  });

  it("SECURITY: a customer cannot write an address row owned by someone else", async () => {
    const { error } = await customerClient.from("addresses").insert({
      user_id: "00000000-0000-0000-0000-000000000001",
      type: "shipping",
      first_name: "Injected",
      last_name: "Address",
      address_1: "1 Attacker Street",
      city: "Nowhere",
      state: "NA",
      postal_code: "00000",
      country: "Nowhere",
      phone: "+10000000000",
    });

    // Without a WITH CHECK clause on the INSERT policy, this succeeds and
    // poisons another shopper's saved-address list.
    expect(error).not.toBeNull();
  });
});
