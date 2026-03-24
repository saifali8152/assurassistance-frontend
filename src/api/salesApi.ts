//src/api/salesApi.ts
import { apiPost, apiPatch} from "../lib/api";
import api from "../lib/api";
import type {
  CreateSaleRequest,
  CreateSaleResponse,
} from "./interfaces";

export const createSaleApi = async (data: CreateSaleRequest): Promise<CreateSaleResponse> => {
  return apiPost<CreateSaleResponse>("/sales", data);
};

export const generateInvoiceApi = async (saleId: number) => {
  return api.get(`/sales/invoice/${saleId}`, { responseType: 'blob' });
};

export const generateCertificateApi = async (saleId: number) => {
  return api.get(`/sales/certificate/${saleId}`, { responseType: 'blob' });
};

export const getCertificatePageDataApi = (saleId: number) => api.get(`/sales/certificate/${saleId}/page`);

/** Public certificate JSON (same shape as authenticated) — no login */
export const getCertificatePageDataPublicApi = (token: string) =>
  api.get(`/sales/certificate/public/${encodeURIComponent(token)}`);

/** ZIP of PDF certificates for a group subscription (after all sales confirmed) */
export const downloadGroupCertificatesZipApi = (groupId: string) =>
  api.get(`/sales/group/${encodeURIComponent(groupId)}/certificates-zip`, { responseType: "blob" });

export const updatePaymentApi = (saleId: string, payment_status: string, payment_notes: string, received_amount: number) => {
  return apiPatch(`/sales/${saleId}/payment`, {
    payment_status,
    payment_notes,
    received_amount
  });
};


