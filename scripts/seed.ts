import { createClient } from "@supabase/supabase-js";
import { initialCategories, initialProducts, initialStoreSettings, initialCoupons, initialHomepageSections } from "../supabase/seed/seed_data";

// Add any missing variables that we assume exist based on typical seed structures
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Seeding categories...");
  if (initialCategories) {
    const { error } = await supabase.from("categories").upsert(initialCategories);
    if (error) console.error("Error categories:", error);
  }

  console.log("Seeding products...");
  if (initialProducts) {
    const { error } = await supabase.from("products").upsert(initialProducts);
    if (error) console.error("Error products:", error);
  }

  console.log("Seeding store settings...");
  if (typeof initialStoreSettings !== 'undefined') {
    const { error } = await supabase.from("store_settings").upsert(initialStoreSettings);
    if (error) console.error("Error store settings:", error);
  }

  console.log("Seeding coupons...");
  if (typeof initialCoupons !== 'undefined') {
    const { error } = await supabase.from("coupons").upsert(initialCoupons);
    if (error) console.error("Error coupons:", error);
  }

  console.log("Seeding homepage sections...");
  if (typeof initialHomepageSections !== 'undefined') {
    const { error } = await supabase.from("homepage_sections").upsert(initialHomepageSections);
    if (error) console.error("Error homepage sections:", error);
  }

  console.log("Seed complete.");
}

main().catch(console.error);
