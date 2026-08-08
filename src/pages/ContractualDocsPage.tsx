// ContractualDocsPage.tsx
//
// Contractual documentation (Terms & Conditions) downloads.
// All authenticated users may download. Only Admin may upload / replace.
//
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  deleteContractualDocumentApi,
  downloadContractualDocumentApi,
  listContractualDocumentsApi,
  uploadContractualDocumentApi,
  type ContractualDocKey,
  type ContractualDocument,
} from "../api/contractualDocsApi";

const SLOTS: ContractualDocKey[] = ["full", "brief"];

function formatBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const ContractualDocsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [docs, setDocs] = useState<ContractualDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<ContractualDocKey | null>(null);
  const [savingKey, setSavingKey] = useState<ContractualDocKey | null>(null);

  const [drafts, setDrafts] = useState<
    Record<ContractualDocKey, { title: string; description: string; file: File | null }>
  >({
    full: { title: "", description: "", file: null },
    brief: { title: "", description: "", file: null },
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listContractualDocumentsApi();
      const list = res?.data ?? [];
      setDocs(list);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const d of list) {
          next[d.doc_key] = {
            title: d.title || "",
            description: d.description || "",
            file: null,
          };
        }
        return next;
      });
    } catch (e) {
      console.error(e);
      toast.error(t("contractualDocs.loadError", "Failed to load documents."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const labelFor = (key: ContractualDocKey) =>
    key === "full"
      ? t(
          "contractualDocs.downloadFull",
          "Download Terms and Conditions – Full Version"
        )
      : t(
          "contractualDocs.downloadBrief",
          "Download Terms and Conditions – Brief Version"
        );

  const byKey = (key: ContractualDocKey) =>
    docs.find((d) => d.doc_key === key) || null;

  const onDownload = async (key: ContractualDocKey) => {
    const doc = byKey(key);
    if (!doc?.has_file) {
      toast.error(t("contractualDocs.notAvailable", "This document is not available yet."));
      return;
    }
    try {
      setDownloading(key);
      await downloadContractualDocumentApi(
        key,
        doc.original_filename || `${key}-terms.pdf`
      );
      toast.success(t("contractualDocs.downloadOk", "Download started."));
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          t("contractualDocs.downloadError", "Failed to download the document.")
      );
    } finally {
      setDownloading(null);
    }
  };

  const onSave = async (key: ContractualDocKey) => {
    const draft = drafts[key];
    const existing = byKey(key);
    if (!draft.title.trim()) {
      toast.error(t("contractualDocs.titleRequired", "Title is required."));
      return;
    }
    if (!draft.description.trim()) {
      toast.error(
        t("contractualDocs.descriptionRequired", "A short description is required.")
      );
      return;
    }
    if (!draft.file && !existing?.has_file) {
      toast.error(t("contractualDocs.fileRequired", "Please choose a file to upload."));
      return;
    }
    try {
      setSavingKey(key);
      await uploadContractualDocumentApi(key, {
        title: draft.title.trim(),
        description: draft.description.trim(),
        file: draft.file,
      });
      toast.success(
        existing?.has_file
          ? t("contractualDocs.replaced", "Document replaced.")
          : t("contractualDocs.uploaded", "Document uploaded.")
      );
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          t("contractualDocs.saveError", "Failed to save the document.")
      );
    } finally {
      setSavingKey(null);
    }
  };

  const onRemove = async (key: ContractualDocKey) => {
    if (!byKey(key)?.has_file) return;
    if (
      !window.confirm(
        t(
          "contractualDocs.confirmDelete",
          "Remove this document? Users will no longer be able to download it."
        )
      )
    ) {
      return;
    }
    try {
      setSavingKey(key);
      await deleteContractualDocumentApi(key);
      toast.success(t("contractualDocs.deleted", "Document removed."));
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          t("contractualDocs.deleteError", "Failed to remove the document.")
      );
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          {t("contractualDocs.title", "Contractual Documentation Download")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {isAdmin
            ? t(
                "contractualDocs.subtitleAdmin",
                "Upload or replace the full and brief Terms and Conditions. Provide a title and a short description for each file. Other users can only download."
              )
            : t(
                "contractualDocs.subtitleUser",
                "Download the Terms and Conditions documents available for your language."
              )}
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-text-secondary">
          {t("contractualDocs.loading", "Loading…")}
        </div>
      ) : (
        <div className="space-y-4">
          {SLOTS.map((key) => {
            const doc = byKey(key);
            const draft = drafts[key];
            const busy = savingKey === key || downloading === key;
            return (
              <div
                key={key}
                className="rounded-xl border border-[#D9D9D9] bg-white p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[#E4590F]">
                      <FileText className="w-5 h-5 shrink-0" />
                      <h2 className="text-base font-semibold text-[#1A1A1A]">
                        {labelFor(key)}
                      </h2>
                    </div>
                    {doc?.has_file ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">
                          {doc.title}
                        </p>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">
                          {doc.description}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {doc.original_filename || "—"}
                          {doc.file_size != null ? ` · ${formatBytes(doc.file_size)}` : ""}
                          {doc.updated_at
                            ? ` · ${new Date(doc.updated_at).toLocaleDateString()}`
                            : ""}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-text-secondary">
                        {t(
                          "contractualDocs.emptySlot",
                          "No file uploaded for this version yet."
                        )}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!doc?.has_file || busy}
                    onClick={() => onDownload(key)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E4590F] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-[#c94c0c] shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    {downloading === key
                      ? t("contractualDocs.downloading", "Downloading…")
                      : t("contractualDocs.download", "Download")}
                  </button>
                </div>

                {isAdmin && (
                  <div className="mt-4 border-t border-[#EEEEEE] pt-4 space-y-3">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                      {doc?.has_file
                        ? t("contractualDocs.adminReplace", "Update / replace (Admin)")
                        : t("contractualDocs.adminUpload", "Upload (Admin)")}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm sm:col-span-2">
                        <span className="text-xs font-medium text-text-secondary">
                          {t("contractualDocs.fieldTitle", "Title")}
                        </span>
                        <input
                          type="text"
                          maxLength={255}
                          value={draft.title}
                          onChange={(e) =>
                            setDrafts((p) => ({
                              ...p,
                              [key]: { ...p[key], title: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F]"
                          placeholder={t(
                            "contractualDocs.titlePlaceholder",
                            "e.g. Terms and Conditions – Full Version"
                          )}
                        />
                      </label>
                      <label className="block text-sm sm:col-span-2">
                        <span className="text-xs font-medium text-text-secondary">
                          {t("contractualDocs.fieldDescription", "Short description")}
                        </span>
                        <textarea
                          rows={2}
                          maxLength={1000}
                          value={draft.description}
                          onChange={(e) =>
                            setDrafts((p) => ({
                              ...p,
                              [key]: { ...p[key], description: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F] resize-y"
                          placeholder={t(
                            "contractualDocs.descriptionPlaceholder",
                            "Brief summary of this document for users"
                          )}
                        />
                      </label>
                      <label className="block text-sm sm:col-span-2">
                        <span className="text-xs font-medium text-text-secondary">
                          {t("contractualDocs.fieldFile", "File (PDF, DOC, DOCX)")}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) =>
                            setDrafts((p) => ({
                              ...p,
                              [key]: {
                                ...p[key],
                                file: e.target.files?.[0] || null,
                              },
                            }))
                          }
                          className="mt-1 block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-[#E4590F]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#E4590F]"
                        />
                        {draft.file && (
                          <span className="mt-1 block text-xs text-text-secondary">
                            {draft.file.name} · {formatBytes(draft.file.size)}
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onSave(key)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#E4590F] bg-[#E4590F]/10 px-3 py-2 text-sm font-medium text-[#E4590F] hover:bg-[#E4590F]/20 disabled:opacity-40"
                      >
                        <Upload className="w-4 h-4" />
                        {savingKey === key
                          ? t("contractualDocs.saving", "Saving…")
                          : doc?.has_file
                            ? t("contractualDocs.replaceBtn", "Save / replace")
                            : t("contractualDocs.uploadBtn", "Upload")}
                      </button>
                      {doc?.has_file && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onRemove(key)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t("contractualDocs.removeBtn", "Remove")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContractualDocsPage;
