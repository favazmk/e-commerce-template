"use client";

import React, { useCallback, useId, useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, Link2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reusable image picker for the admin panel.
 *
 * Offers two routes to the same outcome — a public image URL:
 *   1. picking (or dropping) a file from the admin's own device, which is
 *      uploaded to Supabase Storage; or
 *   2. pasting a URL that is already hosted somewhere public.
 *
 * `onUploaded` is called once per resulting URL, so a multi-file selection
 * appends several images in one action.
 */
export function ImageUploader({
  onUploaded,
  label = "Upload from your device",
  multiple = false,
  allowUrl = true,
  compact = false,
}: {
  onUploaded: (url: string) => void;
  label?: string;
  multiple?: boolean;
  allowUrl?: boolean;
  compact?: boolean;
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [urlValue, setUrlValue] = useState("");

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      setError("");
      setIsUploading(true);

      try {
        const body = new FormData();
        for (const file of list) body.append("file", file);

        const res = await fetch("/api/admin/media", { method: "POST", body });
        const payload = await res.json();

        if (!res.ok || !payload.success) {
          throw new Error(payload?.error?.message || "Upload failed.");
        }

        for (const asset of payload.data as Array<{ url: string }>) {
          onUploaded(asset.url);
        }
      } catch (err: any) {
        setError(err.message || "Upload failed.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onUploaded]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
  };

  const handleAddUrl = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    onUploaded(trimmed);
    setUrlValue("");
    setError("");
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-brand border-2 border-dashed transition-colors ${
          compact ? "p-4" : "p-6"
        } ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple={multiple}
          className="sr-only"
          onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          ) : (
            <UploadCloud className="h-6 w-6 text-slate-400" />
          )}

          <p className="text-xs font-semibold text-slate-700">
            {isUploading ? "Uploading…" : label}
          </p>

          {!isUploading && (
            <>
              <p className="text-[11px] text-slate-400">
                Drag an image here, or
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
              >
                Choose {multiple ? "images" : "image"} from device
              </Button>
              <p className="text-[10px] text-slate-400">
                JPG, PNG, WebP, AVIF or GIF · up to 8&nbsp;MB each
              </p>
            </>
          )}
        </div>
      </div>

      {allowUrl && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              placeholder="…or paste an image URL"
              className="block w-full rounded-brand border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddUrl} className="text-xs">
            Add URL
          </Button>
        </div>
      )}

      {error && (
        <p className="flex items-start gap-1.5 rounded-brand border border-rose-200 bg-rose-50 p-2.5 text-[11px] font-semibold text-rose-700">
          <X className="mt-px h-3.5 w-3.5 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

/**
 * A single-image field: uploader plus a live preview of the current value.
 * Used wherever a record holds exactly one image (category cover, homepage
 * section banner).
 */
export function SingleImageField({
  value,
  onChange,
  label = "Cover image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2 text-left">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </span>

      {value ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-brand border border-slate-200 bg-slate-100">
          <Image
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            src={value}
            alt="Selected image preview"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600 shadow-sm transition-colors hover:bg-white"
            title="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <ImageUploader onUploaded={onChange} compact label="Upload a cover image" />
      )}

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-[11px] font-semibold text-slate-500 hover:text-rose-600"
        >
          Replace image
        </button>
      )}
    </div>
  );
}
