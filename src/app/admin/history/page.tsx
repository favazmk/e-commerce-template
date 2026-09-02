"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  History,
  Undo2,
  Package,
  Layers,
  Tag,
  Sliders,
  Settings,
  Archive,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { AdminChangeLogEntry, AdminChangeEntityType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

const ENTITY_META: Record<
  AdminChangeEntityType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  product: { label: "Product", icon: Package },
  category: { label: "Category", icon: Layers },
  coupon: { label: "Coupon", icon: Tag },
  homepage_section: { label: "Homepage", icon: Sliders },
  settings: { label: "Settings", icon: Settings },
  inventory: { label: "Stock", icon: Archive },
  review: { label: "Review", icon: MessageSquare },
};

const FILTERS: Array<{ key: "all" | AdminChangeEntityType; label: string }> = [
  { key: "all", label: "Everything" },
  { key: "product", label: "Products" },
  { key: "inventory", label: "Stock" },
  { key: "coupon", label: "Coupons" },
  { key: "review", label: "Reviews" },
  { key: "category", label: "Categories" },
  { key: "homepage_section", label: "Homepage" },
  { key: "settings", label: "Settings" },
];

/** "3 minutes ago", "yesterday" — easier to scan than a timestamp when undoing. */
function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminHistoryPage() {
  const [entries, setEntries] = useState<AdminChangeLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | AdminChangeEntityType>("all");
  const [pendingUndo, setPendingUndo] = useState<AdminChangeLogEntry | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const notify = (tone: "ok" | "error", text: string) => {
    setFeedback({ tone, text });
    setTimeout(() => setFeedback(null), 6000);
  };

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/history", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setEntries(data.data || []);
      else notify("error", data.error?.message || "Could not load the history.");
    } catch {
      notify("error", "Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const visible = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.entity_type === filter)),
    [entries, filter]
  );

  /** The newest change that can still be undone — the "undo last change" target. */
  const lastUndoable = useMemo(
    () => entries.find((e) => !e.reverted_at && !e.is_revert),
    [entries]
  );

  const handleUndo = async () => {
    if (!pendingUndo) return;
    setIsUndoing(true);

    try {
      const res = await fetch("/api/admin/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: pendingUndo.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Undo failed.");

      setPendingUndo(null);
      notify("ok", data.message || "Change undone.");
      await fetchHistory();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            Safety Net
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Change History
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Everything changed in the admin panel, newest first. Undo puts the record back exactly
            as it was before that change.
          </p>
        </div>

        {lastUndoable && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setPendingUndo(lastUndoable)}
            className="gap-2 shadow-sm flex-shrink-0"
          >
            <Undo2 className="h-4 w-4" /> Undo last change
          </Button>
        )}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-brand border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.key
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-400">Loading history…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-brand-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <History className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Nothing recorded yet</p>
          <p className="mt-1 text-xs text-slate-500">
            {filter === "all"
              ? "Changes you make in the admin panel will appear here, ready to undo."
              : "No changes of this kind yet. Try a different filter."}
          </p>
        </div>
      ) : (
        <ol className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle divide-y divide-slate-100 overflow-hidden">
          {visible.map((entry) => {
            const meta = ENTITY_META[entry.entity_type] ?? {
              label: entry.entity_type,
              icon: History,
            };
            const Icon = meta.icon;
            const isUndone = Boolean(entry.reverted_at);

            return (
              <li
                key={entry.id}
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${
                  isUndone || entry.is_revert ? "bg-slate-50" : "bg-white"
                }`}
              >
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    entry.is_revert
                      ? "bg-slate-200 text-slate-600"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {entry.is_revert ? (
                    <Undo2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {meta.label}
                    </span>
                    {entry.action === "delete" && !entry.is_revert && (
                      <Badge variant="danger" size="sm">
                        deleted
                      </Badge>
                    )}
                    {entry.action === "create" && !entry.is_revert && (
                      <Badge variant="success" size="sm">
                        created
                      </Badge>
                    )}
                    {isUndone && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <CheckCircle2 className="h-3 w-3" /> undone
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{entry.summary}</p>
                  <p className="text-xs text-slate-500">
                    {relativeTime(entry.created_at)}
                    {entry.actor_email ? ` · ${entry.actor_email}` : ""}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {isUndone ? (
                    <span className="text-xs font-semibold text-slate-400">Already undone</span>
                  ) : entry.is_revert ? (
                    <span className="text-xs font-semibold text-slate-400">This was an undo</span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingUndo(entry)}
                      className="gap-1.5 text-xs"
                    >
                      <Undo2 className="h-3.5 w-3.5" /> Undo
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Undo confirmation */}
      <Modal
        isOpen={Boolean(pendingUndo)}
        onClose={() => setPendingUndo(null)}
        title="Undo this change?"
        description={pendingUndo?.summary}
      >
        <div className="mt-4 space-y-3">
          <p className="rounded-brand border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            {pendingUndo?.action === "create"
              ? "This will remove the record that was created."
              : pendingUndo?.action === "delete"
              ? "This will restore the deleted record, along with everything saved on it at the time."
              : "This will put the record back exactly as it was before that change."}{" "}
            The undo is itself recorded, so you can see what happened afterwards.
          </p>

          {pendingUndo?.entity_type === "inventory" && (
            <p className="rounded-brand border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              Stock has probably moved since. Undoing sets the count back to what it was, which
              also reverses any sales recorded in between — check the current number first.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setPendingUndo(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isUndoing}
              onClick={handleUndo}
              className="gap-1.5"
            >
              <Undo2 className="h-3.5 w-3.5" /> Undo it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
