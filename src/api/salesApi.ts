//src/api/salesApi.ts
import { apiPost ,apiGet, apiPatch} from "../lib/api";
import type {
  CreateSaleRequest,
  CreateSaleResponse,
    DownloadResponse,
} from "./interfaces";

export const createSaleApi = async (data: CreateSaleRequest): Promise<CreateSaleResponse> => {
  return apiPost<CreateSaleResponse>("/sales", data);
};

export const generateInvoiceApi = async (saleId: number): Promise<DownloadResponse> => {
  return apiGet<DownloadResponse>(`/sales/${saleId}/invoice`);
};

export const generateCertificateApi = async (saleId: number): Promise<DownloadResponse> => {
  return apiGet<DownloadResponse>(`/sales/${saleId}/certificate`);
};



export const updatePaymentApi = (saleId: string, payment_status: string, payment_notes: string) => {
  return apiPatch(`/sales/${saleId}/payment`, {
    payment_status,
    payment_notes
  });
};

