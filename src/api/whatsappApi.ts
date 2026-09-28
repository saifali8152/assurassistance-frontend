// src/api/whatsappApi.ts
//
// Read access to WhatsApp conversations, for the admin screen.
// Mirrors /api/whatsapp/* — see backend/docs/API.md §16.
//
import { apiGet } from "../lib/api";

export type SessionStatus = "active" | "completed" | "expired" | "cancelled" | "escalated";

export type WhatsAppSession = {
  id: number;
  waNumber: string;
  profileName: string | null;
  language: "fr" | "en";
  flowKey: string;
  currentStep: string | null;
  stepHistory: string[];
  collectedData: Record<string, unknown>;
  retryCount: number;
  status: SessionStatus;
  customerMessageCount: number;
  travellerId: number | null;
  caseId: number | null;
  quoteReference: string | null;
  lastActivityAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  messageTotal?: number;
};

export type WhatsAppMessage = {
  id: number;
  sessionId: number | null;
  waNumber: string;
  direction: "inbound" | "outbound";
  waMessageId: string | null;
  messageType: string;
  body: string | null;
  stepKey: string | null;
  status: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type WhatsAppStats = {
  windowDays: number;
  completedSessions: number;
  averageCustomerMessages: number | null;
  minCustomerMessages: number | null;
  maxCustomerMessages: number | null;
  target: { min: number; max: number };
};

export type Pagination = { page: number; limit: number; total: number; pages: number };

export const listWhatsAppSessionsApi = (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}) => {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiGet<{ success: boolean; data: WhatsAppSession[]; pagination: Pagination }>(
    `/whatsapp/sessions${suffix}`
  );
};

export const getWhatsAppSessionApi = (id: number) =>
  apiGet<{ success: boolean; data: WhatsAppSession }>(`/whatsapp/sessions/${id}`);

export const getWhatsAppMessagesApi = (id: number, limit = 300) =>
  apiGet<{ success: boolean; data: WhatsAppMessage[] }>(
    `/whatsapp/sessions/${id}/messages?limit=${limit}`
  );

export const getWhatsAppStatsApi = (days = 30) =>
  apiGet<{ success: boolean; data: WhatsAppStats }>(`/whatsapp/stats?days=${days}`);

export const getWhatsAppStatusApi = () =>
  apiGet<{
    success: boolean;
    data: {
      enabled: boolean;
      ready: boolean;
      businessNumber: string | null;
      defaultLanguage: string;
      supportedLanguages: string[];
      sessionTimeoutHours: number;
    };
  }>("/whatsapp/status");
