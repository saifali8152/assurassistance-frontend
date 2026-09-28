// src/api/whatsappSettingsApi.ts
//
// Superadmin WhatsApp settings. Mirrors /api/admin/whatsapp-settings.
//
// Secrets are write-only by design: the API returns a mask, never the value, so
// the UI must send a secret field only when the admin actually types a new one.
//
import { apiGet, apiPost, apiPut } from "../lib/api";

export type SettingGroup = "status" | "connection" | "conversation" | "attribution";
export type SettingType = "string" | "number" | "boolean" | "json";

export type WhatsAppSetting = {
  key: string;
  group: SettingGroup;
  type: SettingType;
  secret: boolean;
  description: string | null;
  allowed: string[] | null;
  min: number | null;
  max: number | null;
  /** Null for secrets — read `masked` instead. */
  value: string | number | boolean | null;
  /** e.g. "••••••••wxyz" for secrets, null otherwise. */
  masked: string | null;
  isSet: boolean;
  updated_at: string | null;
  updated_by_user_id: number | null;
};

export type WhatsAppSettingsStatus = {
  enabled: boolean;
  ready: boolean;
  missing: string[];
  encryptionAvailable: boolean;
  decryptionErrors: string[];
};

export type WhatsAppSettingsPayload = {
  settings: WhatsAppSetting[];
  status: WhatsAppSettingsStatus;
  webhook: { url: string; methods: string[]; verifyTokenSet: boolean };
};

export type ConnectionTestResult = {
  phoneNumberId: string;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  qualityRating: string | null;
  platformType: string | null;
  apiVersion: string;
};

export type AttributionCandidate = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export const getWhatsAppSettingsApi = () =>
  apiGet<{ success: boolean; data: WhatsAppSettingsPayload }>("/admin/whatsapp-settings");

export const updateWhatsAppSettingsApi = (settings: Record<string, unknown>) =>
  apiPut<{
    success: boolean;
    message?: string;
    data: { changed: string[]; skipped: string[]; status: Partial<WhatsAppSettingsStatus> };
  }>("/admin/whatsapp-settings", { settings });

export const testWhatsAppConnectionApi = () =>
  apiPost<{ success: boolean; message?: string; data: ConnectionTestResult }>(
    "/admin/whatsapp-settings/test",
    {}
  );

export const regenerateVerifyTokenApi = () =>
  apiPost<{ success: boolean; message?: string; data: { verifyToken: string; webhookUrl: string } }>(
    "/admin/whatsapp-settings/verify-token",
    {}
  );

export const revealVerifyTokenApi = () =>
  apiGet<{ success: boolean; data: { verifyToken: string; webhookUrl: string } }>(
    "/admin/whatsapp-settings/verify-token"
  );

export const listAttributionCandidatesApi = (search = "") =>
  apiGet<{ success: boolean; data: AttributionCandidate[] }>(
    `/admin/whatsapp-settings/attribution-candidates${search ? `?search=${encodeURIComponent(search)}` : ""}`
  );
