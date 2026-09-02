"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, Eye, EyeOff, Edit2 } from "lucide-react";
import { HomepageSection } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SingleImageField } from "@/components/admin/ImageUploader";

export default function AdminHomepageBuilderPage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<HomepageSection | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const notify = (tone: "ok" | "error", text: string) => {
    setFeedback({ tone, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data.sections) setSections(data.data.sections);
      else notify("error", data.error?.message || "Could not load homepage sections.");
    } catch {
      notify("error", "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSections();
  }, [fetchSections]);

  const handleToggle = async (section: HomepageSection) => {
    const next = !section.is_enabled;
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, is_enabled: next } : s))
    );

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: section.id, sectionData: { is_enabled: next } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Update failed.");
      notify("ok", `Section is now ${next ? "visible" : "hidden"} on the storefront.`);
    } catch (err: any) {
      notify("error", err.message);
      await fetchSections();
    }
  };

  /**
   * Reordering is only real once the new order reaches the database — the
   * previous version rearranged the list locally and persisted nothing.
   */
  const handleMove = async (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    const reordered = [...sections];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];

    const previous = sections;
    setSections(reordered.map((s, i) => ({ ...s, display_order: i })));
    setIsReordering(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionOrder: reordered.map((s) => s.id) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Reorder failed.");
      if (Array.isArray(data.data)) setSections(data.data);
      notify("ok", "New section order saved.");
    } catch (err: any) {
      setSections(previous);
      notify("error", err.message);
    } finally {
      setIsReordering(false);
    }
  };

  const openEdit = (s: HomepageSection) => {
    setActiveSection(s);
    setTitle(s.title || "");
    setSubtitle(s.subtitle || "");
    setImageUrl(s.image_url || "");
    setIsEditModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSection) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: activeSection.id,
          sectionData: { title, subtitle, image_url: imageUrl || null },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Save failed.");

      setIsEditModalOpen(false);
      notify("ok", "Homepage section saved.");
      await fetchSections();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
          Presentation &amp; Content
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Storefront Homepage Builder
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Reorder, hide or restyle the blocks that make up your home page. Banner images can be
          uploaded straight from your device.
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

      {isLoading ? (
        <p className="text-xs text-slate-400">Loading sections…</p>
      ) : sections.length === 0 ? (
        <div className="rounded-brand-xl border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-500">
          No homepage sections are configured for this store yet.
        </div>
      ) : (
        <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle divide-y divide-slate-100 overflow-hidden">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={`p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                !section.is_enabled ? "bg-slate-50 opacity-60" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex flex-col gap-1 text-slate-400">
                  <button
                    type="button"
                    disabled={idx === 0 || isReordering}
                    onClick={() => handleMove(idx, "up")}
                    className="p-1 hover:text-slate-900 disabled:opacity-20"
                    aria-label="Move section up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sections.length - 1 || isReordering}
                    onClick={() => handleMove(idx, "down")}
                    className="p-1 hover:text-slate-900 disabled:opacity-20"
                    aria-label="Move section down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>

                {section.image_url && (
                  <div className="relative hidden h-14 w-24 flex-shrink-0 overflow-hidden rounded-brand border border-slate-200 bg-slate-100 sm:block">
                    <Image
                      fill
                      sizes="96px"
                      src={section.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                    {section.section_type}
                  </span>
                  <h3 className="mt-1 truncate text-base font-bold text-slate-900">
                    {section.title || "Section Untitled"}
                  </h3>
                  <p className="truncate text-xs text-slate-500">
                    {section.subtitle || "No subtitle configured"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleToggle(section)}
                  className={`p-2 rounded-brand border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    section.is_enabled
                      ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  {section.is_enabled ? (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Hidden
                    </>
                  )}
                </button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(section)}
                  className="text-xs gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Content
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Section Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Section: ${activeSection?.section_type}`}
        description="Update the headline copy and the banner image shown on your home page."
      >
        <form onSubmit={handleSaveSection} className="space-y-4 mt-4">
          <Input label="Section Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label="Section Subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />

          <SingleImageField
            value={imageUrl}
            onChange={setImageUrl}
            label="Cover / Banner Image"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
