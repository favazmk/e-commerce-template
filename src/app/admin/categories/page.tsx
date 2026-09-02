"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Layers, Pencil } from "lucide-react";
import { Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SingleImageField } from "@/components/admin/ImageUploader";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const notify = (tone: "ok" | "error", text: string) => {
    setFeedback({ tone, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setCategories(data.data || []);
      else notify("error", data.error?.message || "Could not load categories.");
    } catch {
      notify("error", "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("");
    setDisplayOrder(String(categories.length + 1));
    setIsModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setImageUrl(category.image_url || "");
    setDisplayOrder(String(category.display_order ?? 1));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
      description,
      image_url: imageUrl || null,
      display_order: Number(displayOrder) || 1,
    };

    try {
      const res = await fetch(
        editingId ? `/api/categories/${editingId}` : "/api/categories",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Could not save the category.");
      }

      setIsModalOpen(false);
      notify("ok", editingId ? "Category updated." : "Category created.");
      await fetchCategories();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    try {
      const res = await fetch(`/api/categories/${target.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Delete failed.");
      notify("ok", `${target.name} deleted. Its products are now uncategorised.`);
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      await fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Catalog Structure
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Store Categories ({categories.length})
          </h1>
        </div>
        <Button variant="primary" size="md" onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
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
        <p className="text-xs text-slate-400">Loading categories…</p>
      ) : categories.length === 0 ? (
        <div className="rounded-brand-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Layers className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No categories yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Categories group your products and become browsable pages on the storefront.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-brand-xl border border-slate-200 bg-white overflow-hidden shadow-subtle flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                {cat.image_url ? (
                  <Image
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Layers className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="p-4 flex-1">
                <h3 className="font-bold text-slate-900 font-heading text-base">{cat.name}</h3>
                <p className="text-[11px] font-mono text-slate-400">/categories/{cat.slug}</p>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{cat.description}</p>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-3">
                <span className="text-[11px] text-slate-400">Order: {cat.display_order}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="rounded-brand p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    title="Edit category"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(cat)}
                    className="rounded-brand p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    title="Delete category"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Category" : "Add New Category"}
        description="Categories group your products and become browsable pages on the storefront."
      >
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            label="Category Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fine Cashmere"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="URL Slug (Optional)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="fine-cashmere"
            />
            <Input
              label="Display Order"
              type="number"
              min="1"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              helperText="Lower numbers appear first."
            />
          </div>

          <SingleImageField value={imageUrl} onChange={setImageUrl} label="Banner / Cover Image" />

          <div className="space-y-1.5 text-left">
            <label
              htmlFor="categoryDescription"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Description
            </label>
            <textarea
              id="categoryDescription"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-brand border border-slate-300 p-2.5 text-xs focus:outline-none"
              placeholder="Brief description of this collection..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {editingId ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name}?`}
        description="Products in this category are not deleted — they become uncategorised and stay on sale."
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
            Delete category
          </Button>
        </div>
      </Modal>
    </div>
  );
}
