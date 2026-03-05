// src/api/caseApi.ts
import { apiGet, apiPost, apiPatch, apiPut } from "../lib/api";
import api from "../lib/api";
import type { CreateCaseResponse } from "./interfaces";

// Create a case with traveller
export const createCaseApi = async (data: any): Promise<CreateCaseResponse> => {
  return await apiPost<CreateCaseResponse>("/cases", data);
};

// Get all cases for the logged-in agent
export const getMyCasesApi = () => apiGet("/cases");

// Get all cases with pagination (admin only)
export const getAllCasesApi = (page: number = 1, limit: number = 10) => 
  apiGet(`/cases/all?page=${page}&limit=${limit}`);

// Get cases for agent with pagination
export const getMyCasesWithPaginationApi = (page: number = 1, limit: number = 10) => 
  apiGet(`/cases/my-cases?page=${page}&limit=${limit}`);

// Get pending sales (cases without sales)
export const getPendingSalesApi = () => apiGet("/cases/pending-sales");

// Change case status
export const changeCaseStatusApi = (id: number, status: string) =>
  apiPatch(`/cases/${id}/status`, { status });

// Confirm sale for a case (admin only)
export const confirmSaleApi = (caseId: number, data: { premium_amount: number; tax?: number; total: number }) =>
  apiPost(`/cases/${caseId}/confirm-sale`, data);

// Cancel case (admin only)
export const cancelCaseApi = (caseId: number) =>
  apiPost(`/cases/${caseId}/cancel`, {});

// Generate and download invoice
export const generateInvoiceApi = (caseId: number) =>
  api.get(`/sales/invoice/${caseId}`, { responseType: 'blob' });

// Generate and download certificate
export const generateCertificateApi = (caseId: number) =>
  api.get(`/sales/certificate/${caseId}`, { responseType: 'blob' });

// Update case
export const updateCaseApi = (caseId: number, data: any) =>
  apiPut(`/cases/${caseId}/update`, data);
