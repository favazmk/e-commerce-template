"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit3, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/**
 * Row actions for the admin product table.
 *
 * The table itself is a Server Component; only these controls need to be
 * interactive, so the client boundary is kept to a single row.
 */
export function ProductRowActions({
  productId,
  productName,
  productSlug,
}: {
  productId: string;
  productName: string;
  productSlug: string;
}) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Could not delete this product.");
      }

      setIsConfirmOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/products/${productSlug}`}
          target="_blank"
          className="rounded-brand p-1.5 text-slate-400 hover:text-slate-700"
          title="View live product page"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
        <Link
          href={`/admin/products/${productId}/edit`}
          className="rounded-brand p-1.5 text-slate-400 hover:text-slate-900"
          title="Edit product"
        >
          <Edit3 className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="rounded-brand p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          title="Delete product"
          aria-label={`Delete ${productName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={`Delete ${productName}?`}
        description="This permanently removes the product, its images and its sizes. To take it off sale without losing it, set its status to Archived instead."
      >
        {error && (
          <p className="mt-3 rounded-brand border border-rose-200 bg-rose-50 p-2.5 text-[11px] font-semibold text-rose-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={isDeleting}
            onClick={handleDelete}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>
    </>
  );
}
