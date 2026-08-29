export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export class StorageService {
  /**
   * Upload an image/asset and return its optimized public URL
   */
  static async uploadFile(
    fileName: string,
    fileBuffer: Buffer | Blob,
    mimeType: string
  ): Promise<UploadResult> {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "ecommerce-assets";
    const cleanName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // If Supabase Storage is configured:
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      try {
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${cleanName}`;
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": mimeType,
          },
          body: fileBuffer as any,
        });

        if (res.ok) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanName}`;
          return {
            url: publicUrl,
            key: cleanName,
            size: typeof (fileBuffer as any).length === "number" ? (fileBuffer as any).length : 0,
            mimeType,
          };
        }
      } catch (err) {
        console.error("[StorageService] Supabase upload failed:", err);
      }
    }

    // If all else fails
    throw new Error("Storage upload failed. Please configure Supabase Storage properly.");
  }
}
