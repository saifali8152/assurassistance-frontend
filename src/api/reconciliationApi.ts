import { apiGet } from "../lib/api";

export const getReconciliationApi = async (month: string, year: string) => {
  return apiGet(`/reconciliation?month=${month}&year=${year}`);
};