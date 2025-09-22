// src/api/caseApi.ts
import { apiGet, apiPost, apiPatch } from "../lib/api";
import type { CreateCaseResponse } from "./interfaces";

// Create a case with traveller
export const createCaseApi = async (data: any): Promise<CreateCaseResponse> => {
  return await apiPost<CreateCaseResponse>("/cases", data);
};

// Get all cases for the logged-in agent
export const getMyCasesApi = () => apiGet("/cases");

// Change case status
export const changeCaseStatusApi = (id: number, status: string) =>
  apiPatch(`/cases/${id}/status`, { status });
