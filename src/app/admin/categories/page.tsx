"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Layers, Check } from "lucide-react";
import { Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import Image from "next/image";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description,
          image_url: imageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setName("");
        setSlug("");
        setDescription("");
        setImageUrl("");
        fetchCategories();
      }
    } catch (e) {
      console.error("Create category error", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Catalog Structure
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Store Categories ({categories.length})
          </h1>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-brand-xl border border-slate-200 bg-white overflow-hidden shadow-subtle flex flex-col justify-between"
          >
            <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
              {cat.image_url ? (
                <Image fill sizes="(max-width: 768px) 100vw, 33vw" src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
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
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Order: {cat.display_order}</span>
              <span className="font-semibold text-emerald-600">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Category"
        description="Define a new collection grouping for your store products."
      >
        <form onSubmit={handleCreateCategory} className="space-y-4 mt-4">
          <Input
            label="Category Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fine Cashmere"
          />
          <Input
            label="URL Slug (Optional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="fine-cashmere"
          />
          <Input
            label="Banner / Cover Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/placeholder.jpg"
          />
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description
            </label>
            <textarea
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
              Create Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
