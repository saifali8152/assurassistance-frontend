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

export const updatePaymentApi = (saleId: string, payment_status: string, payment_notes: string, received_amount: number) => {
  return apiPatch(`/sales/${saleId}/payment`, {
    payment_status,
    payment_notes,
    received_amount
  });
};


