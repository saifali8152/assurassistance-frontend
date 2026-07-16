// Partner (travel agency / corporate) period invoices with commission deductions.
import { apiGet } from "../lib/api";
import api from "../lib/api";

export type InvoicePartner = {
  id: number;
  name: string;
  email: string;
  company_name: string | null;
  partnership_type: string | null;
};

export type PartnerInvoiceLine = {
  sale_id: number;
  case_id: number;
  traveller_name: string;
  traveller_phone: string;
  plan_name: string;
  policy_number: string;
  certificate_number: string;
  plan_premium: number;
  tax: number;
  total: number;
  received_amount: number;
  payment_status: string;
  confirmed_at: string;
  currency: string;
  created_by_name: string;
  /** Invoice-only commission, deducted from the premium total. */
  commission: number;
};

export type PartnerInvoiceTotals = {
  totalPremiums: number;
  totalCommissions: number;
  totalReceived: number;
  netToTransfer: number;
};

export type PartnerInvoiceData = {
  invoiceNumber: string;
  partner: {
    id: number;
    name: string;
    company_name: string | null;
    partnership_type: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  period: { startDate: string; endDate: string };
  commissionTiers: { days: number; premium: number; commission: number }[];
  lines: PartnerInvoiceLine[];
  totals: PartnerInvoiceTotals;
};

export type PartnerInvoiceSummary = {
  totalSales: number;
  totalPremiums: number;
  totalCollected: number;
  totalCommissions: number;
  netToTransfer: number;
  startDate: string;
  endDate: string;
};

/** Partners the caller may invoice (sub-admins only see their supervised agencies). */
export const getInvoicePartnersApi = async () =>
  apiGet<{ success: boolean; data: InvoicePartner[] }>("/partner-invoices/partners");

export const getPartnerInvoiceApi = async (partnerId: number, startDate: string, endDate: string) =>
  apiGet<{ success: boolean; data: PartnerInvoiceData }>(
    `/partner-invoices/${partnerId}?startDate=${startDate}&endDate=${endDate}`
  );

export const getPartnerInvoiceSummaryApi = async (startDate: string, endDate: string) =>
  apiGet<{ success: boolean; data: PartnerInvoiceSummary }>(
    `/partner-invoices/summary?startDate=${startDate}&endDate=${endDate}`
  );

/** PDF invoice download (blob). Amounts convert from XOF to `currency` (XOF|USD|EUR). */
export const downloadPartnerInvoicePdfApi = (
  partnerId: number,
  startDate: string,
  endDate: string,
  currency: string = "XOF"
) =>
  api.get(
    `/partner-invoices/${partnerId}/pdf?startDate=${startDate}&endDate=${endDate}&currency=${encodeURIComponent(currency)}`,
    { responseType: "blob" }
  );
