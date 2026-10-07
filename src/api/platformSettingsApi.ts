// src/api/platformSettingsApi.ts
//
// Everything the insurer fills in that is not WhatsApp: document numbering,
// company identity, certificate wording and the four mobile money providers.
// Mirrors /api/admin/whatsapp-settings/platform.
//
// Secrets behave exactly as they do on the WhatsApp screen: the API returns a
// mask, never the stored value, so a secret field is only submitted when the
// admin explicitly types a new one. Saving a country list can therefore never
// blank out an API key.
//
import { apiGet, apiPut } from "../lib/api";

export type SettingType = "string" | "number" | "boolean" | "json";

export type PlatformSetting = {
  key: string;
  group: string;
  type: SettingType;
  secret: boolean;
  description: string | null;
  allowed: string[] | null;
  min: number | null;
  max: number | null;
  /** Null for secrets — read `masked` instead. */
  value: string | number | boolean | null;
  masked: string | null;
  isSet: boolean;
  updated_at: string | null;
  updated_by_user_id: number | null;
};

export type ProviderStatus = {
  code: string;
  label: string;
  enabled: boolean;
  ready: boolean;
  /** Setting suffixes still blank, e.g. ["api_key", "countries"]. */
  missing: string[];
  countries: string[];
};

export type PaymentStatus = {
  enabled: boolean;
  ready: boolean;
  currency: string;
  timeoutMinutes: number;
  countries: string[];
  providers: ProviderStatus[];
};

export type PlatformSettingsPayload = {
  settings: PlatformSetting[];
  payment: PaymentStatus;
  encryptionAvailable: boolean;
  decryptionErrors: string[];
};

export const getPlatformSettingsApi = () =>
  apiGet<{ success: boolean; data: PlatformSettingsPayload }>(
    "/admin/whatsapp-settings/platform"
  );

export const updatePlatformSettingsApi = (settings: Record<string, unknown>) =>
  apiPut<{
    success: boolean;
    message?: string;
    data: {
      changed: string[];
      skipped: string[];
      payment: { enabled: boolean; ready: boolean; providers: { code: string; ready: boolean; missing: string[] }[] };
    };
  }>("/admin/whatsapp-settings/platform", { settings });

/** The provider codes the backend knows, in the order the screen shows them. */
export const PROVIDER_ORDER = ["orange", "mtn", "wave", "moov"] as const;
