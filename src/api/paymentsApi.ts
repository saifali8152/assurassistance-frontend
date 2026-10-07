// src/api/paymentsApi.ts
//
// The payments screen. Mirrors /api/admin/payments.
//
// The payer's number never arrives in full — the API masks it to the last four
// digits. That is enough to confirm a number with a customer on the phone and
// useless as a contact list, which is the right trade for a screen several
// people can open.
//
import { apiGet, apiPost } from "../lib/api";

export type PaymentStatus =
  | "pending"
  | "initiated"
  | "awaiting_confirmation"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled";

export type PaymentRow = {
  id: number;
  reference: string;
  provider: string;
  provider_tx_id: string | null;
  amount: string | number;
  currency: string;
  status: PaymentStatus;
  failure_code: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  case_id: number | null;
  sale_id: number | null;
  wa_session_id: number | null;
  policy_number: string | null;
  msisdn_masked: string | null;
};

export type PaymentCallback = {
  id: number;
  provider: string;
  provider_tx_id: string | null;
  signature_valid: 0 | 1;
  processed: 0 | 1;
  duplicate: 0 | 1;
  process_error: string | null;
  remote_ip: string | null;
  content_type: string | null;
  received_at: string;
  body_bytes: number | null;
};

export type PaymentHistoryEntry = {
  from: string;
  to: string;
  at: string;
  by: string;
  note?: string;
};

export type PaymentDetail = Omit<PaymentRow, "msisdn_masked"> & {
  msisdn_masked: string | null;
  status_history: PaymentHistoryEntry[];
  failure_detail: string | null;
  certificate_number: string | null;
  sale_payment_status: string | null;
  initiated_at: string | null;
  callbacks: PaymentCallback[];
};

export type PaymentStats = {
  days: number;
  byStatus: { status: PaymentStatus; count: number; amount: number }[];
  /** Past their window and not settled — someone should look. */
  stuck: number;
  /** Money taken with no policy issued. The one figure worth interrupting someone for. */
  paidWithoutPolicy: number;
};

export type PaymentListFilters = {
  page?: number;
  limit?: number;
  status?: PaymentStatus | "";
  provider?: string;
  search?: string;
  from?: string;
  to?: string;
};

const qs = (filters: PaymentListFilters) => {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const listPaymentsApi = (filters: PaymentListFilters = {}) =>
  apiGet<{ success: boolean; data: { rows: PaymentRow[]; total: number; page: number; limit: number } }>(
    `/admin/payments${qs(filters)}`
  );

export const paymentStatsApi = (days = 7) =>
  apiGet<{ success: boolean; data: PaymentStats }>(`/admin/payments/stats?days=${days}`);

export const getPaymentApi = (id: number) =>
  apiGet<{ success: boolean; data: PaymentDetail }>(`/admin/payments/${id}`);

export const getCallbackBodyApi = (callbackId: number) =>
  apiGet<{ success: boolean; data: { id: number; provider: string; raw_body: string; received_at: string } }>(
    `/admin/payments/callbacks/${callbackId}/body`
  );

/** Ask the provider now rather than waiting for the two-minute poller. */
export const pollPaymentApi = (id: number) =>
  apiPost<{
    success: boolean;
    data: { settled: boolean; status: PaymentStatus; reason?: string; failureCode?: string | null; policyNumber?: string | null };
  }>(`/admin/payments/${id}/poll`, {});

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "initiated",
  "awaiting_confirmation",
  "completed",
  "failed",
  "expired",
  "cancelled",
];
