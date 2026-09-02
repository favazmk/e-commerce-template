"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Check, Trash2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ImageUploader } from "@/components/admin/ImageUploader";

interface StoredAsset {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  updatedAt: string | null;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMediaLibraryPage() {
  const [assets, setAssets] = useState<StoredAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StoredAsset | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const notify = (tone: "ok" | "error", text: string) => {
    setFeedback({ tone, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/media", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setAssets(data.data || []);
      else notify("error", data.error?.message || "Could not load the media library.");
    } catch {
      notify("error", "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAssets();
  }, [fetchAssets]);

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 1500);
    } catch {
      notify("error", "Your browser blocked clipboard access.");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    try {
      const res = await fetch(`/api/admin/media?key=${encodeURIComponent(target.key)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Delete failed.");
      notify("ok", "Image deleted.");
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      await fetchAssets();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
          Assets &amp; Media
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Media Asset Library ({assets.length})
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Images uploaded here are stored on your own site and can be reused anywhere in the admin.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-brand border p-3 text-xs font-semibold ${
            feedback.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Upload */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900">
          Add images to the library
        </h2>
        <ImageUploader
          multiple
          allowUrl={false}
          label="Upload images from your device"
          onUploaded={() => {
            // Each upload resolves independently; refetch to show the new file.
            void fetchAssets();
          }}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <p className="text-xs text-slate-400">Loading library…</p>
      ) : assets.length === 0 ? (
        <div className="rounded-brand-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ImageOff className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Your library is empty</p>
          <p className="mt-1 text-xs text-slate-500">
            Upload an image above and it will appear here, ready to copy into any product or banner.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.key}
              className="group relative rounded-brand-xl border border-slate-200 bg-white overflow-hidden shadow-subtle flex flex-col"
            >
              <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden">
                <Image
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                  src={asset.url}
                  alt={asset.key}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPendingDelete(asset)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  title="Delete image"
                  aria-label={`Delete ${asset.key}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white p-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[10px] text-slate-500" title={asset.key}>
                    {asset.key}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatBytes(asset.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(asset.url)}
                  className="flex flex-shrink-0 items-center gap-1 rounded-brand bg-slate-100 p-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  {copiedUrl === asset.url ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this image?"
        description="This removes the file permanently. Any product or banner still pointing at it will show a broken image."
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
