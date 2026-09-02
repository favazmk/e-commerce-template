"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrencyLabel } from "@/lib/config/store.config";

interface ImportRow {
  rowNumber: number;
  action: "create" | "update" | "skip";
  errors: string[];
  warnings: string[];
  payload: Record<string, any> | null;
  existingProductId?: string;
  display: {
    name: string;
    sku: string;
    price: string;
    stock: number;
    category: string;
    images: number;
    sizes: number;
    status: string;
  };
}

interface ImportPreview {
  rows: ImportRow[];
  totals: { total: number; create: number; update: number; invalid: number };
  unknownColumns: string[];
  missingColumns: string[];
}

interface CommitResult {
  created: number;
  updated: number;
  failed: Array<{ rowNumber: number; sku: string; message: string }>;
}

export default function AdminProductImportPage() {
  const router = useRouter();
  const currency = getCurrencyLabel();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);

  const importable = useMemo(
    () => preview?.rows.filter((r) => r.action !== "skip" && r.payload) ?? [],
    [preview]
  );

  const visibleRows = useMemo(() => {
    if (!preview) return [];
    return showOnlyProblems
      ? preview.rows.filter((r) => r.errors.length > 0 || r.warnings.length > 0)
      : preview.rows;
  }, [preview, showOnlyProblems]);

  const resetAll = () => {
    setPreview(null);
    setResult(null);
    setError("");
    setFileName("");
    setShowOnlyProblems(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setError("");
    setResult(null);
    setPreview(null);
    setFileName(file.name);
    setIsParsing(true);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/products/import", { method: "POST", body });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Could not read that file.");
      }

      setPreview(data.data);
    } catch (err: any) {
      setError(err.message);
      setFileName("");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (importable.length === 0) return;
    setIsImporting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: importable.map((row) => ({
            rowNumber: row.rowNumber,
            action: row.action,
            payload: row.payload,
            existingProductId: row.existingProductId,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "The import failed.");
      }

      setResult(data.data);
      setPreview(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
        </button>
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
          Catalogue Tools
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Import Products from a Spreadsheet
        </h1>
        <p className="mt-1 max-w-2xl text-xs text-slate-500">
          Upload an Excel or CSV file to add or update many products at once. You will see exactly
          what will happen before anything is saved.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-brand border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          <XCircle className="mt-px h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ------------------------------------------------- Step 1: the file -- */}
      {!preview && !result && (
        <>
          <div className="rounded-brand-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  1. Start from the template
                </h2>
                <p className="mt-1 max-w-xl text-xs text-slate-500">
                  The template has every column with the right heading, one worked example, and a
                  second sheet explaining what each column means. Fill it in and upload it below.
                </p>
              </div>
              <a href="/api/admin/products/import/template" download>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download template
                </Button>
              </a>
            </div>
          </div>

          <div className="rounded-brand-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              2. Upload your file
            </h2>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) void handleFile(e.dataTransfer.files[0]);
              }}
              className={`rounded-brand border-2 border-dashed p-8 transition-colors ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-300 bg-slate-50 hover:border-slate-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xlsm,.csv"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
              />

              <div className="flex flex-col items-center gap-2 text-center">
                {isParsing ? (
                  <>
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                    <p className="text-sm font-semibold text-slate-700">
                      Checking {fileName}…
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-7 w-7 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">
                      Drag your spreadsheet here
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose a file
                    </Button>
                    <p className="text-[11px] text-slate-400">
                      .xlsx or .csv · up to 12&nbsp;MB · 2000 rows per import
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-brand border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] leading-relaxed text-slate-600">
                <strong className="font-semibold text-slate-800">How rows are matched:</strong> a
                row whose SKU already exists updates that product; a new SKU creates one. On an
                update, leaving <code className="rounded bg-white px-1">image_urls</code> or{" "}
                <code className="rounded bg-white px-1">sizes</code> blank keeps whatever the
                product already has. Products import as <strong>drafts</strong> unless the status
                column says otherwise, so nothing goes on sale by accident.
              </p>
            </div>
          </div>
        </>
      )}

      {/* -------------------------------------------- Step 2: the preview --- */}
      {preview && (
        <>
          {preview.missingColumns.length > 0 ? (
            <div className="rounded-brand-xl border border-rose-200 bg-rose-50 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-rose-900">
                <XCircle className="h-4 w-4" /> That file is missing required columns
              </h2>
              <p className="mt-2 text-xs text-rose-800">
                The first row of the sheet must contain these headings:{" "}
                <strong>{preview.missingColumns.join(", ")}</strong>. Download the template and
                copy your data into it.
              </p>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={resetAll}>
                  Choose another file
                </Button>
                <a href="/api/admin/products/import/template" download>
                  <Button type="button" variant="primary" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download template
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="rounded-brand-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-subtle">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{fileName}</p>
                      <p className="text-xs text-slate-500">
                        {preview.totals.total} row{preview.totals.total === 1 ? "" : "s"} read.
                        Nothing has been saved yet.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={resetAll}>
                      Choose another file
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      isLoading={isImporting}
                      disabled={importable.length === 0}
                      onClick={handleImport}
                      className="gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Import {importable.length} row{importable.length === 1 ? "" : "s"}
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "New products", value: preview.totals.create, tone: "emerald" },
                    { label: "Updates", value: preview.totals.update, tone: "blue" },
                    { label: "Cannot import", value: preview.totals.invalid, tone: "rose" },
                    { label: "Rows read", value: preview.totals.total, tone: "slate" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-brand border border-slate-200 bg-slate-50 p-3"
                    >
                      <p
                        className={`font-heading text-2xl font-bold tabular-nums ${
                          stat.tone === "emerald"
                            ? "text-emerald-700"
                            : stat.tone === "blue"
                            ? "text-blue-700"
                            : stat.tone === "rose"
                            ? "text-rose-700"
                            : "text-slate-900"
                        }`}
                      >
                        {stat.value}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {preview.totals.invalid > 0 && (
                  <p className="mt-4 flex items-start gap-2 rounded-brand border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="mt-px h-3.5 w-3.5 flex-shrink-0" />
                    {preview.totals.invalid} row{preview.totals.invalid === 1 ? "" : "s"} cannot be
                    imported and will be skipped. Fix them in the sheet and upload again, or import
                    the rest now and add them later.
                  </p>
                )}

                {preview.unknownColumns.length > 0 && (
                  <p className="mt-3 text-[11px] text-slate-500">
                    Columns that were ignored because the importer does not recognise them:{" "}
                    <span className="font-mono">{preview.unknownColumns.join(", ")}</span>
                  </p>
                )}
              </div>

              {/* Row table */}
              <div className="rounded-brand-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">
                  <h2 className="text-sm font-bold text-slate-900">Row by row</h2>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={showOnlyProblems}
                      onChange={(e) => setShowOnlyProblems(e.target.checked)}
                    />
                    Show only rows with problems
                  </label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Row</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Price ({currency})</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Media</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleRows.map((row) => {
                        const hasErrors = row.errors.length > 0;

                        return (
                          <React.Fragment key={row.rowNumber}>
                            <tr className={hasErrors ? "bg-rose-50/60" : "hover:bg-slate-50/80"}>
                              <td className="px-4 py-3 font-mono text-slate-400 tabular-nums">
                                {row.rowNumber}
                              </td>
                              <td className="px-4 py-3">
                                {hasErrors ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                                    <XCircle className="h-3 w-3" /> Skipped
                                  </span>
                                ) : row.action === "create" ? (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                    New
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                    Update
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {row.display.name}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-500">
                                {row.display.sku}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-slate-800">
                                {row.display.price}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-slate-800">
                                {row.display.stock}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{row.display.category}</td>
                              <td className="px-4 py-3 text-slate-500">
                                {row.display.images} image{row.display.images === 1 ? "" : "s"}
                                {row.display.sizes > 0 && ` · ${row.display.sizes} sizes`}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{row.display.status}</td>
                            </tr>

                            {(row.errors.length > 0 || row.warnings.length > 0) && (
                              <tr className={hasErrors ? "bg-rose-50/60" : "bg-amber-50/40"}>
                                <td colSpan={9} className="px-4 pb-3 pt-0">
                                  <ul className="space-y-1">
                                    {row.errors.map((message, i) => (
                                      <li
                                        key={`e${i}`}
                                        className="flex items-start gap-1.5 text-[11px] font-semibold text-rose-700"
                                      >
                                        <XCircle className="mt-px h-3 w-3 flex-shrink-0" />
                                        {message}
                                      </li>
                                    ))}
                                    {row.warnings.map((message, i) => (
                                      <li
                                        key={`w${i}`}
                                        className="flex items-start gap-1.5 text-[11px] text-amber-800"
                                      >
                                        <AlertTriangle className="mt-px h-3 w-3 flex-shrink-0" />
                                        {message}
                                      </li>
                                    ))}
                                  </ul>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {visibleRows.length === 0 && (
                  <p className="p-8 text-center text-xs text-slate-400">
                    No rows have problems — everything is ready to import.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* --------------------------------------------- Step 3: the result --- */}
      {result && (
        <div className="rounded-brand-xl border border-slate-200 bg-white p-6 shadow-subtle">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold font-heading text-slate-900">Import finished</h2>
              <p className="mt-1 text-sm text-slate-600">
                {result.created} product{result.created === 1 ? "" : "s"} created and{" "}
                {result.updated} updated.
                {result.failed.length > 0 &&
                  ` ${result.failed.length} row${
                    result.failed.length === 1 ? "" : "s"
                  } could not be saved.`}
              </p>

              {result.failed.length > 0 && (
                <div className="mt-4 rounded-brand border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs font-bold text-rose-900">Rows that failed to save</p>
                  <ul className="mt-2 space-y-1">
                    {result.failed.map((failure) => (
                      <li key={failure.rowNumber} className="text-[11px] text-rose-800">
                        <span className="font-mono">Row {failure.rowNumber}</span>
                        {failure.sku && <span className="font-mono"> ({failure.sku})</span>} —{" "}
                        {failure.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/admin/products">
                  <Button type="button" variant="primary" size="sm">
                    View the catalogue
                  </Button>
                </Link>
                <Button type="button" variant="outline" size="sm" onClick={resetAll}>
                  Import another file
                </Button>
              </div>

              <p className="mt-4 text-[11px] text-slate-500">
                Imported products are drafts unless the sheet said otherwise — set them to Active
                in the catalogue when you are ready to sell them.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
