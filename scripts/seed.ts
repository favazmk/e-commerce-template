import { createClient } from "@supabase/supabase-js";
import { initialCategories, initialProducts, initialStoreSettings, initialCoupons, initialHomepageSections } from "../supabase/seed/seed_data";

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const uuidMap = new Map<string, string>();
let uuidCounter = 1;

function getUUID(oldId: string | null | undefined): string | null {
  if (!oldId) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(oldId)) return oldId;
  
  if (oldId.startsWith("p")) {
     // try replacing 'p' with 'b' for product IDs to make them valid hex
     const fixed = oldId.replace(/^p/, 'b');
     if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fixed)) {
       return fixed;
     }
  }

  if (!uuidMap.has(oldId)) {
    uuidMap.set(oldId, `00000000-0000-0000-0000-${String(uuidCounter++).padStart(12, '0')}`);
  }
  return uuidMap.get(oldId)!;
}

async function main() {
  console.log("Seeding categories...");
  if (initialCategories) {
    const catsToInsert = initialCategories.map(c => ({...c, id: getUUID(c.id), parent_id: getUUID(c.parent_id)}));
    const { error } = await supabase.from("categories").upsert(catsToInsert);
    if (error) console.error("Error categories:", error);
  }

  console.log("Seeding products...");
  if (initialProducts) {
    const productsToInsert = [];
    const productImagesToInsert = [];
    const productVariantsToInsert = [];

    for (let i = 0; i < initialProducts.length; i++) {
      const p = initialProducts[i];
      const { images, variants, ...productData } = p as any;
      
      const newProductId = getUUID(productData.id);
      productsToInsert.push({
        ...productData,
        id: newProductId,
        category_id: getUUID(productData.category_id)
      });

      if (images) {
        for (let j = 0; j < images.length; j++) {
          const img = images[j];
          productImagesToInsert.push({
            ...img,
            id: getUUID(img.id),
            product_id: newProductId
          });
        }
      }

      if (variants) {
        for (let j = 0; j < variants.length; j++) {
          const variant = variants[j];
          productVariantsToInsert.push({
            ...variant,
            id: getUUID(variant.id),
            product_id: newProductId
          });
        }
      }
    }

    const { error: pError } = await supabase.from("products").upsert(productsToInsert);
    if (pError) console.error("Error products:", pError);

    if (productImagesToInsert.length > 0) {
      const { error: iError } = await supabase.from("product_images").upsert(productImagesToInsert);
      if (iError) console.error("Error product_images:", iError);
    }

    if (productVariantsToInsert.length > 0) {
      const { error: vError } = await supabase.from("product_variants").upsert(productVariantsToInsert);
      if (vError) console.error("Error product_variants:", vError);
    }
  }

  console.log("Seeding store settings...");
  if (typeof initialStoreSettings !== 'undefined') {
    const settingsToInsert = Object.keys(initialStoreSettings).map(key => ({
      key,
      value: initialStoreSettings[key]
    }));
    const { error } = await supabase.from("store_settings").upsert(settingsToInsert);
    if (error) console.error("Error store settings:", error);
  }

  console.log("Seeding coupons...");
  if (typeof initialCoupons !== 'undefined') {
    const couponsToInsert = initialCoupons.map((c, i) => ({
      ...c,
      id: getUUID(c.id)
    }));
    const { error } = await supabase.from("coupons").upsert(couponsToInsert);
    if (error) console.error("Error coupons:", error);
  }

  console.log("Seeding homepage sections...");
  if (typeof initialHomepageSections !== 'undefined') {
    const sectionsToInsert = initialHomepageSections.map((s, i) => ({
      ...s,
      id: getUUID(s.id)
    }));
    const { error } = await supabase.from("homepage_sections").upsert(sectionsToInsert);
    if (error) console.error("Error homepage sections:", error);
  }

  console.log("Seed complete.");
}

main().catch(console.error);
