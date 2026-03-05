import { apiGet } from "../lib/api";

const API_BASE_URL = "https://backend.acareeracademy.com/api"; // same as in lib/api.ts

export interface LedgerFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getLedgerApi = (filters: LedgerFilters) => {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
  return apiGet(`/ledger?${qs.toString()}`);
};

// download CSV - returns full backend URL for fetch()
export const downloadLedgerCsvApi = (filters: LedgerFilters) => {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
  return `${API_BASE_URL}/ledger/export?${qs.toString()}`;
};
