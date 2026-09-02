/**
 * Verify the device-upload pipeline against real Supabase Storage:
 * upload a file, confirm it is publicly readable, confirm it appears in the
 * library listing, then delete it and confirm it is gone.
 *
 * Mirrors what StorageService does, so a pass here means the admin upload
 * button has a working path all the way to a public image URL.
 *
 * Usage: node scripts/verify-storage.mjs
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "ecommerce-assets";

if (!baseUrl || !serviceKey) {
  console.error("Storage is not configured; set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey };

const results = [];
function check(label, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

// A 1x1 PNG, standing in for a photo chosen from the admin's device.
const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const key = `verify-upload-${Date.now()}.png`;
let uploaded = false;

try {
  // 1. Upload
  const upload = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${key}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "image/png" },
    body: new Uint8Array(pngBytes),
  });
  uploaded = upload.ok;
  check("Upload accepted by the bucket", upload.ok, `HTTP ${upload.status}`);

  // 2. Publicly readable — the storefront renders these without a signed URL.
  const publicUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${key}`;
  const read = await fetch(publicUrl);
  check(
    "Uploaded image is publicly readable",
    read.ok && (read.headers.get("content-type") || "").startsWith("image/"),
    `HTTP ${read.status} ${read.headers.get("content-type")}`
  );

  // 3. Appears in the media library listing
  const list = await fetch(`${baseUrl}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 200, sortBy: { column: "created_at", order: "desc" } }),
  });
  const rows = list.ok ? await list.json() : [];
  check(
    "Image appears in the media library listing",
    Array.isArray(rows) && rows.some((r) => r.name === key)
  );

  // 4. Delete
  const remove = await fetch(`${baseUrl}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [key] }),
  });
  check("Delete removes the file", remove.ok, `HTTP ${remove.status}`);
  uploaded = false;

  // Assert on the bucket, not the public URL: Supabase serves public objects
  // through a CDN that keeps returning a deleted file until its cache expires,
  // so a 200 there proves nothing about whether the object still exists.
  const listAfter = await fetch(`${baseUrl}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 200, sortBy: { column: "created_at", order: "desc" } }),
  });
  const rowsAfter = listAfter.ok ? await listAfter.json() : [];
  check(
    "Deleted image is gone from the bucket",
    Array.isArray(rowsAfter) && !rowsAfter.some((r) => r.name === key)
  );
} finally {
  // Never leave a probe file behind in the client's asset library.
  if (uploaded) {
    await fetch(`${baseUrl}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [key] }),
    }).catch(() => {});
  }

  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} checks passed.`);
  if (passed !== results.length) process.exitCode = 1;
}
