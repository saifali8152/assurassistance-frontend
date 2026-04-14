// src/api/caseApi.ts
import { apiGet, apiPost, apiPatch, apiPut } from "../lib/api";
import api from "../lib/api";
import type { CreateCaseResponse, CreateGroupCasesResponse } from "./interfaces";

// Create a case with traveller
export const createCaseApi = async (data: any): Promise<CreateCaseResponse> => {
  return await apiPost<CreateCaseResponse>("/cases", data);
};

export const createGroupCasesApi = async (data: {
  travellers: any[];
  caseData: any;
}): Promise<CreateGroupCasesResponse> => {
  return await apiPost<CreateGroupCasesResponse>("/cases/group", data);
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

// Generate and download invoice (id = sale id)
export const generateInvoiceApi = (saleId: number) =>
  api.get(`/sales/invoice/${saleId}`, { responseType: 'blob' });

/** Legacy PDF certificate download (id = sale id). Prefer printable page at /certificate/:saleId */
export const generateCertificateApi = (saleId: number) =>
  api.get(`/sales/certificate/${saleId}`, { responseType: 'blob' });

// Update case
export const updateCaseApi = (caseId: number, data: any) =>
  apiPut(`/cases/${caseId}/update`, data);

export interface PolicyEditMeta {
  hasSale: boolean;
  saleId: number | null;
  policyEditCount: number;
  policyEditsRemaining: number;
  departureDate: string;
  operatorLimitedEditOpen: boolean;
  inLast24HoursBeforeDeparture: boolean;
  hasDeparted: boolean;
  agentMayEditLimitedFields: boolean;
  adminMayEditAllFields: boolean;
  agentBlockedFromEditing: boolean;
}

export const getPolicyEditMetaApi = async (caseId: number): Promise<PolicyEditMeta | null> => {
  try {
    const res = await apiGet<{ success: boolean; data: PolicyEditMeta }>(`/cases/${caseId}/policy-edit-meta`);
    const body = res as unknown as { data?: PolicyEditMeta };
    return body?.data ?? null;
  } catch {
    return null;
  }
};

/** Full case row for resuming / editing (same access rules as update) */
export const getCaseByIdApi = async (caseId: number): Promise<Record<string, unknown> | null> => {
  try {
    const res = await apiGet<{ success: boolean; data: Record<string, unknown> }>(`/cases/${caseId}`);
    return res?.data ?? null;
  } catch {
    return null;
  }
};
