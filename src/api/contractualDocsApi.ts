import api, { apiDelete, apiGet, apiPatch, apiPostFormData } from "../lib/api";

export type ContractualDocKey = "full" | "brief";

export type ContractualDocument = {
  id: number | null;
  doc_key: ContractualDocKey;
  title: string | null;
  description: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by_user_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  has_file: boolean;
  download_url: string | null;
};

export const listContractualDocumentsApi = () =>
  apiGet<{ success: boolean; data: ContractualDocument[]; keys: ContractualDocKey[] }>(
    "/contractual-documents"
  );

export const uploadContractualDocumentApi = (
  key: ContractualDocKey,
  payload: { title: string; description: string; file?: File | null }
) => {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("description", payload.description);
  if (payload.file) form.append("file", payload.file);
  return apiPostFormData<{ success: boolean; message?: string; data: ContractualDocument }>(
    `/contractual-documents/${key}`,
    form
  );
};

export const updateContractualDocumentMetaApi = (
  key: ContractualDocKey,
  payload: { title: string; description: string }
) =>
  apiPatch<{ success: boolean; data: ContractualDocument }>(`/contractual-documents/${key}`, payload);

export const deleteContractualDocumentApi = (key: ContractualDocKey) =>
  apiDelete<{ success: boolean; message?: string }>(`/contractual-documents/${key}`);

/** Download as blob and trigger browser save. */
export const downloadContractualDocumentApi = async (
  key: ContractualDocKey,
  fallbackName: string
) => {
  const res = await api.get(`/contractual-documents/${key}/download`, {
    responseType: "blob",
  });
  const disposition = String(res.headers["content-disposition"] || "");
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  const filename = match?.[1] || fallbackName;
  const blob = new Blob([res.data], {
    type: res.headers["content-type"] || "application/octet-stream",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};
