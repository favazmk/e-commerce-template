/**
 * Prove that the database in .env.local is actually protected.
 *
 * Usage:
 *   npm run verify:security
 *
 * A migration file proves nothing until it has been applied, and the most
 * dangerous failure mode of this template is a client store deployed from a
 * checkout where `supabase db push` was never run. The admin panel still looks
 * right, the tests still pass locally, and any registered customer can promote
 * themselves to administrator.
 *
 * So this script does not inspect schema metadata or trust a migrations table.
 * It signs in as a real, throwaway customer and *performs the attacks*, then
 * reports what the database allowed. If it exits non-zero, the store is not
 * safe to take money.
 *
 * It cleans up after itself, and it only ever touches the probe user it
 * created — it never reads or modifies real customer data.
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  console.error(
    "Missing configuration. NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "and SUPABASE_SERVICE_ROLE_KEY must all be set in .env.local."
  );
  process.exit(2);
}

const admin = createClient(url, serviceRoleKey);

// Built from the character code so a literal escape byte never has to survive
// an editor, a formatter or a copy-paste.
const ESC = String.fromCharCode(27);
const GREEN = ESC + "[32m";
const RED = ESC + "[31m";
const YELLOW = ESC + "[33m";
const DIM = ESC + "[2m";
const RESET = ESC + "[0m";

/** Findings, worst first. Anything in here means "do not go live". */
const critical = [];
const warnings = [];

function pass(label) {
  console.log(`  ${GREEN}PASS${RESET}  ${label}`);
}

function fail(label, detail) {
  console.log(`  ${RED}FAIL${RESET}  ${label}`);
  critical.push({ label, detail });
}

function warn(label, detail) {
  console.log(`  ${YELLOW}WARN${RESET}  ${label}`);
  warnings.push({ label, detail });
}

async function main() {
  console.log(`\nSecurity verification against ${DIM}${url}${RESET}\n`);

  // ---------------------------------------------------------------------
  // Provision a throwaway customer with a genuine browser-equivalent session.
  // ---------------------------------------------------------------------
  const email = `security-probe-${Date.now()}@example.test`;
  const password = `Probe-${Math.random().toString(36).slice(2)}-A1!`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Security Probe" },
  });

  if (createError || !created?.user) {
    console.error(`Could not create the probe user: ${createError?.message}`);
    process.exit(2);
  }

  const userId = created.user.id;

  // The handle_new_user() trigger normally creates the profile row; make sure
  // it exists either way before probing it.
  await admin
    .from("users")
    .upsert({ id: userId, email, name: "Security Probe", role: "customer" }, { onConflict: "id" });

  const customer = createClient(url, anonKey);
  const { error: signInError } = await customer.auth.signInWithPassword({ email, password });

  if (signInError) {
    await cleanup(userId);
    console.error(`Could not sign in the probe user: ${signInError.message}`);
    process.exit(2);
  }

  const anonymous = createClient(url, anonKey);

  try {
    // -------------------------------------------------------------------
    console.log("Privilege escalation");
    // -------------------------------------------------------------------
    for (const role of ["super_admin", "admin", "staff"]) {
      await customer.from("users").update({ role }).eq("id", userId);
      const { data } = await admin.from("users").select("role").eq("id", userId).single();

      if (data?.role === "customer") {
        pass(`a customer cannot set their own role to "${role}"`);
      } else {
        fail(
          `a customer CAN set their own role to "${role}"`,
          "Apply supabase/migrations/20260105000000_privilege_escalation_fix.sql. " +
            "Until then, any registered customer can open your entire admin panel."
        );
        // Put it back so the rest of the run is not skewed.
        await admin.from("users").update({ role: "customer" }).eq("id", userId);
      }
    }

    await customer.from("users").update({ email: "attacker@example.test" }).eq("id", userId);
    const { data: emailRow } = await admin.from("users").select("email").eq("id", userId).single();
    if (emailRow?.email === email) {
      pass("a customer cannot rewrite their own sign-in email");
    } else {
      fail(
        "a customer CAN rewrite their own sign-in email",
        "The public profile email must track auth.users; letting it drift desynchronises them."
      );
      await admin.from("users").update({ email }).eq("id", userId);
    }

    // -------------------------------------------------------------------
    console.log("\nCross-customer writes");
    // -------------------------------------------------------------------
    const foreignUserId = "00000000-0000-0000-0000-000000000001";
    const { error: addressError } = await customer.from("addresses").insert({
      user_id: foreignUserId,
      type: "shipping",
      first_name: "Injected",
      last_name: "Address",
      address_1: "1 Probe Street",
      city: "Nowhere",
      state: "NA",
      postal_code: "00000",
      country: "Nowhere",
      phone: "+10000000000",
    });

    if (addressError) {
      pass("a customer cannot insert an address owned by someone else");
    } else {
      fail(
        "a customer CAN insert an address owned by someone else",
        "The addresses INSERT policy is missing its WITH CHECK clause."
      );
      await admin.from("addresses").delete().eq("user_id", foreignUserId);
    }

    // -------------------------------------------------------------------
    console.log("\nCommercially sensitive tables (public browser key)");
    // -------------------------------------------------------------------
    const lockedTables = [
      "payments",
      "refunds",
      "coupons",
      "coupon_usages",
      "inventory_transactions",
      "order_status_history",
      "processed_webhooks",
      "newsletter_subscribers",
      "back_in_stock_requests",
    ];

    for (const table of lockedTables) {
      // Confirm the table has rows, so an empty result cannot pass for the
      // wrong reason.
      const { count } = await admin.from(table).select("*", { count: "exact", head: true });
      const { data: leaked } = await anonymous.from(table).select("*").limit(1);

      if (!leaked || leaked.length === 0) {
        pass(`${table} is unreadable with the public key`);
      } else {
        fail(
          `${table} IS READABLE with the public key`,
          "The anon key ships in your browser bundle, so this data is public."
        );
      }

      if ((count ?? 0) === 0) {
        warn(
          `${table} is empty, so the check above is weaker than it looks`,
          "Re-run once the store has real data."
        );
      }
    }

    // -------------------------------------------------------------------
    console.log("\nCatalog visibility");
    // -------------------------------------------------------------------
    const { data: hiddenProducts } = await anonymous
      .from("products")
      .select("id, status")
      .neq("status", "active")
      .limit(1);

    if (!hiddenProducts || hiddenProducts.length === 0) {
      pass("draft and archived products are not publicly readable");
    } else {
      fail("draft or archived products ARE publicly readable", "Check the products RLS policy.");
    }

    const { data: activeProducts } = await anonymous
      .from("products")
      .select("id")
      .eq("status", "active")
      .limit(1);

    if (activeProducts && activeProducts.length > 0) {
      pass("active products are still publicly readable (hardening did not overshoot)");
    } else {
      warn(
        "no active products are publicly readable",
        "Either the catalog is empty, or the products policy is too strict and the storefront will look broken."
      );
    }

    // -------------------------------------------------------------------
    console.log("\nAdministrative path still works");
    // -------------------------------------------------------------------
    await admin.from("users").update({ role: "admin" }).eq("id", userId);
    const { data: promoted } = await admin.from("users").select("role").eq("id", userId).single();

    if (promoted?.role === "admin") {
      pass("the service role can still promote a user");
    } else {
      fail(
        "the service role CANNOT promote a user",
        "The guard is too aggressive — you will not be able to create an administrator. " +
          "Re-apply 20260105000000_privilege_escalation_fix.sql, which fixes this."
      );
    }
  } finally {
    await cleanup(userId);
  }

  // -----------------------------------------------------------------------
  report();
}

async function cleanup(userId) {
  await admin.from("users").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId).catch(() => {});
}

function report() {
  console.log("");

  if (warnings.length > 0) {
    console.log(`${YELLOW}${warnings.length} warning(s):${RESET}`);
    for (const { label, detail } of warnings) {
      console.log(`  - ${label}\n    ${DIM}${detail}${RESET}`);
    }
    console.log("");
  }

  if (critical.length === 0) {
    console.log(`${GREEN}All security checks passed. This database is safe to take money.${RESET}\n`);
    process.exit(0);
  }

  console.log(`${RED}${critical.length} CRITICAL issue(s) — do not go live:${RESET}`);
  for (const { label, detail } of critical) {
    console.log(`  - ${label}\n    ${DIM}${detail}${RESET}`);
  }
  console.log(
    `\n${DIM}Fix: node scripts/apply-migration.mjs supabase/migrations/20260105000000_privilege_escalation_fix.sql${RESET}\n`
  );
  process.exit(1);
}

main().catch((error) => {
  console.error("\nVerification could not complete:", error?.message || error);
  process.exit(2);
});
