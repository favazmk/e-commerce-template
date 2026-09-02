/**
 * Storage service — uploads binary assets to Supabase Storage and returns a
 * public URL that can be stored on a product, category or homepage section.
 *
 * The bucket is configured by SUPABASE_STORAGE_BUCKET and must be public so
 * that <Image> can render the returned URL without a signed request.
 */

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface StoredAsset {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  updatedAt: string | null;
}

/** Image types the admin media pipeline accepts. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

/** Hard ceiling for a single upload (8 MB). */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function requireConfig(): { baseUrl: string; serviceKey: string; bucket: string } {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "ecommerce-assets";

  // Absence of configuration is a misconfiguration, never a licence to
  // silently succeed with a fabricated URL.
  if (!baseUrl || !serviceKey) {
    throw new Error(
      "Storage is not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set."
    );
  }

  return { baseUrl, serviceKey, bucket };
}

function authHeaders(serviceKey: string): Record<string, string> {
  return { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey };
}

function publicUrlFor(baseUrl: string, bucket: string, key: string): string {
  return `${baseUrl}/storage/v1/object/public/${bucket}/${encodeURI(key)}`;
}

export class StorageService {
  /**
   * Build a collision-proof, URL-safe object key from a user-supplied filename.
   */
  static buildObjectKey(fileName: string): string {
    const safeBase = fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 60)
      .toLowerCase() || "asset";

    const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "bin";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return `${safeBase}-${unique}.${ext}`;
  }

  /**
   * Upload an asset and return its public URL.
   */
  static async uploadFile(
    fileName: string,
    fileBuffer: Buffer | ArrayBuffer | Uint8Array,
    mimeType: string
  ): Promise<UploadResult> {
    const { baseUrl, serviceKey, bucket } = requireConfig();
    const key = StorageService.buildObjectKey(fileName);
    const body = fileBuffer instanceof Buffer ? fileBuffer : Buffer.from(fileBuffer as ArrayBuffer);

    const res = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${encodeURI(key)}`, {
      method: "POST",
      headers: {
        ...authHeaders(serviceKey),
        "Content-Type": mimeType,
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: new Uint8Array(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Upload failed (${res.status}). ${detail}`.trim());
    }

    return {
      url: publicUrlFor(baseUrl, bucket, key),
      key,
      size: body.byteLength,
      mimeType,
    };
  }

  /**
   * List everything currently held in the asset bucket, newest first.
   */
  static async listFiles(limit = 200): Promise<StoredAsset[]> {
    const { baseUrl, serviceKey, bucket } = requireConfig();

    const res = await fetch(`${baseUrl}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { ...authHeaders(serviceKey), "Content-Type": "application/json" },
      body: JSON.stringify({
        prefix: "",
        limit,
        sortBy: { column: "created_at", order: "desc" },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Could not list assets (${res.status}). ${detail}`.trim());
    }

    const rows = (await res.json()) as Array<{
      name: string;
      updated_at?: string | null;
      metadata?: { size?: number; mimetype?: string } | null;
    }>;

    return rows
      // Supabase returns a placeholder row for empty folders; it has no metadata.
      .filter((row) => row.name && row.metadata)
      .map((row) => ({
        key: row.name,
        url: publicUrlFor(baseUrl, bucket, row.name),
        size: row.metadata?.size ?? 0,
        mimeType: row.metadata?.mimetype ?? "application/octet-stream",
        updatedAt: row.updated_at ?? null,
      }));
  }

  /**
   * Permanently remove an asset from the bucket.
   */
  static async deleteFile(key: string): Promise<boolean> {
    const { baseUrl, serviceKey, bucket } = requireConfig();

    const res = await fetch(`${baseUrl}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers: { ...authHeaders(serviceKey), "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [key] }),
    });

    return res.ok;
  }
}
