/**
 * Apply UAE-appropriate store defaults.
 *
 * Usage: node scripts/configure-uae-defaults.mjs
 *
 * The seeded settings were written around a US store: dollar-scale shipping
 * rates, "United States (Domestic Standard)" as the first option a customer
 * sees, and a Monday-to-Friday courier week. None of that is right for a store
 * selling in AED out of the Emirates.
 *
 * Everything written here is editable afterwards in Admin -> Settings. This is
 * a starting point, not a lock-in — adjust the rates to what your courier
 * actually charges before going live.
 *
 * Idempotent: safe to run more than once.
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey);

/**
 * Shipping options, cheapest and most local first.
 *
 * Order matters: the first entry is preselected at checkout, and for a UAE
 * store the overwhelming majority of orders are domestic.
 */
const shipping = {
  enabled: true,
  default_flat_rate: 20,
  // The headline threshold shown in the cart and checkout progress bars.
  free_shipping_threshold: 200,
  zones: [
    {
      id: "zone-uae-standard",
      name: "UAE Standard Delivery",
      rate: 20,
      free_threshold: 200,
      estimated_days: "2-4 Business Days",
    },
    {
      id: "zone-uae-express",
      name: "UAE Next-Day Express",
      rate: 35,
      free_threshold: 500,
      estimated_days: "1-2 Business Days",
    },
    {
      id: "zone-gcc",
      name: "GCC Express (KSA, Kuwait, Qatar, Oman, Bahrain)",
      rate: 75,
      free_threshold: 1000,
      estimated_days: "3-6 Business Days",
    },
    {
      id: "zone-intl",
      name: "International Courier",
      rate: 150,
      free_threshold: null,
      estimated_days: "5-10 Business Days",
    },
  ],
};

const general = {
  // Consumer expectation in the UAE market, and comfortably above the legal
  // minimum. Surfaced on the product page and in the refund policy.
  return_window_days: 14,
  refund_processing_days: 7,
  return_shipping_paid_by: "customer",

  // Order handling.
  handling_days: 1,
  dispatch_cutoff_hour: 14,

  // The UAE weekend has been Saturday and Sunday since January 2022, so those
  // are the days couriers do not deliver. Change this if your courier operates
  // a Friday-Saturday week.
  courier_non_working_days: [0, 6],
};

/** VAT in the UAE is 5% and is quoted exclusive at checkout. */
const tax = {
  enabled: true,
  percentage: 5,
  is_inclusive: false,
  tax_shipping: false,
  tax_name: "VAT",
};

async function upsert(key, value, description) {
  const { error } = await admin
    .from("store_settings")
    .upsert({ key, value, description, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    console.error(`  failed to write "${key}": ${error.message}`);
    return false;
  }
  console.log(`  wrote "${key}"`);
  return true;
}

console.log("\nApplying UAE store defaults\n");

const results = await Promise.all([
  upsert("shipping", shipping, "Delivery options, rates and free-delivery thresholds"),
  upsert("general", general, "Returns window, dispatch timing and courier working days"),
  upsert("tax", tax, "VAT configuration"),
]);

if (results.every(Boolean)) {
  console.log("\nDone. Review and adjust in Admin -> Settings before going live:");
  console.log("  - shipping rates must match what your courier actually charges");
  console.log("  - the free-delivery threshold drives the cart and checkout progress bars");
  console.log("  - confirm the 14-day return window is what you will honour\n");
} else {
  console.log("\nSome settings could not be written. See the errors above.\n");
  process.exit(1);
}
