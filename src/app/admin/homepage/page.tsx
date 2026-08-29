"use client";

import React, { useState, useEffect } from "react";
import { Sliders, ArrowUp, ArrowDown, Eye, EyeOff, Edit2, Check, Sparkles } from "lucide-react";
import { HomepageSection } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export default function AdminHomepageBuilderPage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<HomepageSection | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.data.sections) {
        setSections(data.data.sections);
      }
    } catch (e) {
      console.error("Failed to load sections", e);
    }
  };

  const handleToggle = async (section: HomepageSection) => {
    const updated = { ...section, is_enabled: !section.is_enabled };
    setSections((prev) => prev.map((s) => (s.id === section.id ? updated : s)));

    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId: section.id,
        sectionData: { is_enabled: !section.is_enabled },
      }),
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    const reordered = [...sections];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;

    // Update display orders
    reordered.forEach((s, idx) => {
      s.display_order = idx + 1;
    });

    setSections(reordered);
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

    const updated = {
      ...activeSection,
      title,
      subtitle,
      image_url: imageUrl,
    };

    setSections((prev) => prev.map((s) => (s.id === activeSection.id ? updated : s)));
    setIsEditModalOpen(false);
    setSavedMessage("Homepage section saved!");
    setTimeout(() => setSavedMessage(""), 2000);

    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId: activeSection.id,
        sectionData: {
          title,
          subtitle,
          image_url: imageUrl,
        },
      }),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Presentation & Content
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Storefront Homepage Builder
          </h1>
        </div>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-brand bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
          {savedMessage}
        </div>
      )}

      {/* Sections List */}
      <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle divide-y divide-slate-100 overflow-hidden">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className={`p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
              !section.is_enabled ? "bg-slate-50 opacity-60" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col gap-1 text-slate-400">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, "up")}
                  className="p-1 hover:text-slate-900 disabled:opacity-20"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === sections.length - 1}
                  onClick={() => handleMove(idx, "down")}
                  className="p-1 hover:text-slate-900 disabled:opacity-20"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                  {section.section_type}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {section.title || "Section Untitled"}
                </h3>
                <p className="text-xs text-slate-500">{section.subtitle || "No subtitle configured"}</p>
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

      {/* Edit Section Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Section: ${activeSection?.section_type}`}
        description="Update headline copy and banner background image."
      >
        <form onSubmit={handleSaveSection} className="space-y-4 mt-4">
          <Input
            label="Section Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Section Subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
          <Input
            label="Cover / Banner Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/placeholder.jpg"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
