// src/api/apiKeysApi.ts
//
// Admin management of third-party API keys. Mirrors /api/admin/api-keys.
//
// The secret is returned by exactly two calls — create and rotate — and never
// again afterwards, because only a SHA-256 hash is stored. Every other response
// carries `key_prefix` (e.g. "aas_live_4f9a") so an integrator can still
// identify which key is which.
//
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";

export type ApiKeyStatus = "active" | "revoked";

export type ApiKeyOwner = {
  id: number;
  email: string | null;
  name: string | null;
  role: string | null;
};

export type ApiKey = {
  id: number;
  name: string;
  key_prefix: string;
  scopes: string[];
  ip_allowlist: string | null;
  rate_limit_per_min: number | null;
  status: ApiKeyStatus;
  expires_at: string | null;
  last_used_at: string | null;
  last_used_ip: string | null;
  owner: ApiKeyOwner;
  created_by: { id: number | null; email: string | null };
  created_at: string;
  revoked_at: string | null;
};

export type ApiKeyUsageRow = {
  id: number;
  method: string;
  path: string;
  status_code: number;
  ip: string | null;
  elapsed_ms: number | null;
  created_at: string;
};

export type ApiKeyDetail = ApiKey & { recent_usage: ApiKeyUsageRow[] };

/** Returned once, on create and on rotate. `secret` is never retrievable again. */
export type IssuedApiKey = {
  id: number;
  name: string;
  owner_user_id: number;
  scopes: string[];
  key_prefix: string;
  secret: string;
  ip_allowlist: string | null;
  rate_limit_per_min: number | null;
  expires_at: string | null;
};

export type CreateApiKeyPayload = {
  name: string;
  owner_user_id: number;
  scopes: string[];
  ip_allowlist?: string | null;
  rate_limit_per_min?: number | null;
  expires_at?: string | null;
};

export type UpdateApiKeyPayload = {
  name?: string;
  scopes?: string[];
  ip_allowlist?: string | null;
  rate_limit_per_min?: number | null;
  expires_at?: string | null;
};

export const listApiKeyScopesApi = () =>
  apiGet<{ success: boolean; data: string[] }>("/admin/api-keys/scopes");

export const listApiKeysApi = (ownerUserId?: number) =>
  apiGet<{ success: boolean; data: ApiKey[] }>(
    `/admin/api-keys${ownerUserId ? `?owner_user_id=${ownerUserId}` : ""}`
  );

export const getApiKeyApi = (id: number) =>
  apiGet<{ success: boolean; data: ApiKeyDetail }>(`/admin/api-keys/${id}`);

export const createApiKeyApi = (payload: CreateApiKeyPayload) =>
  apiPost<{ success: boolean; message?: string; data: IssuedApiKey }>(
    "/admin/api-keys",
    payload
  );

export const updateApiKeyApi = (id: number, payload: UpdateApiKeyPayload) =>
  apiPatch<{ success: boolean; data: ApiKey }>(`/admin/api-keys/${id}`, payload);

export const rotateApiKeyApi = (id: number) =>
  apiPost<{ success: boolean; message?: string; data: IssuedApiKey }>(
    `/admin/api-keys/${id}/rotate`,
    {}
  );

export const revokeApiKeyApi = (id: number) =>
  apiDelete<{ success: boolean; message?: string }>(`/admin/api-keys/${id}`);
