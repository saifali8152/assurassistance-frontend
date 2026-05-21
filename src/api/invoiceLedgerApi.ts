import { apiGet, API_BASE_URL } from "../lib/api";

export type RegionDimension = "residence" | "destination" | "agent";

export interface InvoiceLedgerFilters {
  /** YYYY-MM-DD */
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  region?: string;
  regionBy?: RegionDimension;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceLedgerRow {
  invoice_id: number;
  invoice_number: string;
  issue_date: string | null;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  payment_status: "Paid" | "Unpaid" | "Partial" | string;
  sale_id: number;
  policy_number: string | null;
  certificate_number: string | null;
  confirmed_at: string | null;
  plan_price: number | string | null;
  received_amount: number | string | null;
  case_id: number;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  traveller_name: string;
  traveller_country: string | null;
  plan_name: string | null;
  product_type: string | null;
  currency: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  agent_country: string | null;
  agent_geo: string | null;
  region: string;
}

export interface InvoiceLedgerRegionSummaryRow {
  region: string;
  invoice_count: number;
  total_amount: number | string;
  paid_amount: number | string;
  unpaid_amount: number | string;
}

export interface InvoiceLedgerResponse {
  success: boolean;
  data: InvoiceLedgerRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    regionBy: RegionDimension;
  };
  regionSummary: InvoiceLedgerRegionSummaryRow[];
}

function toQs(filters: InvoiceLedgerFilters) {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  return qs.toString();
}

export const getInvoiceLedgerApi = (filters: InvoiceLedgerFilters) =>
  apiGet<InvoiceLedgerResponse>(`/invoice-ledger?${toQs(filters)}`);

/** Returns the full backend URL for the CSV export so it can be hit via fetch(). */
export const downloadInvoiceLedgerCsvUrl = (filters: InvoiceLedgerFilters) =>
  `${API_BASE_URL}/invoice-ledger/export?${toQs(filters)}`;
