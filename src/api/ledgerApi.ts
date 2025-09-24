// src/api/ledgerApi.ts
import { apiGet } from "../lib/api";

export interface LedgerFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// returns { success, data, meta }
export const getLedgerApi = (filters: LedgerFilters) => {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
  return apiGet(`/ledger?${qs.toString()}`);
};

// download CSV - returns a browser-download via link; we will fetch blob
export const downloadLedgerCsvApi = (filters: LedgerFilters) => {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
  const url = `/api/ledger/export?${qs.toString()}`;
  return url;
};
