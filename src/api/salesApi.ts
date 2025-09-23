import { apiPost } from "../lib/api";
import type {
  CreateSaleRequest,
  CreateSaleResponse,
  GenerateInvoiceRequest,
  GenerateCertificateRequest,
  GenerateInvoiceResponse,
  GenerateCertificateResponse
} from "./interfaces";

export const createSaleApi = async (data: CreateSaleRequest): Promise<CreateSaleResponse> => {
  return apiPost<CreateSaleResponse>("/sales", data);
};

export const generateInvoiceApi = async (
  data: GenerateInvoiceRequest
): Promise<GenerateInvoiceResponse> => {
  return apiPost<GenerateInvoiceResponse>("/sales/generate-invoice", data);
};

export const generateCertificateApi = async (
  data: GenerateCertificateRequest
): Promise<GenerateCertificateResponse> => {
  return apiPost<GenerateCertificateResponse>("/sales/generate-certificate", data);
};
