"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Copy, Check, Plus, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminMediaLibraryPage() {
  const [mediaList, setMediaList] = useState<string[]>([]);

  const [newUrl, setNewUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setMediaList((prev) => [newUrl.trim(), ...prev]);
    setNewUrl("");
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Assets & Media
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Media Asset Library ({mediaList.length})
          </h1>
        </div>
      </div>

      {/* Upload / URL Input */}
      <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-emerald-600" /> Add New Asset to Library
        </h3>
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <Input
            placeholder="Paste public image URL (Supabase Storage / Unsplash / CDN)..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <Button type="submit" variant="primary" size="sm">
            Add Image
          </Button>
        </form>
      </div>

      {/* Grid of Images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {mediaList.map((url, i) => (
          <div
            key={i}
            className="group relative rounded-brand-xl border border-slate-200 bg-white overflow-hidden shadow-subtle flex flex-col justify-between"
          >
            <div className="aspect-[3/4] w-full bg-slate-100 overflow-hidden">
              <img src={url} alt="Media Asset" className="h-full w-full object-cover" />
            </div>
            <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                {url}
              </span>
              <button
                onClick={() => handleCopy(url)}
                className="p-1.5 rounded-brand bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 text-[11px] font-semibold"
              >
                {copiedUrl === url ? (
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
    </div>
  );
}
