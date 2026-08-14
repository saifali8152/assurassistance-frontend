//src/agentApi.ts
import { apiPost, apiGet, apiPatch, apiDelete } from "../lib/api";

export type CreateAgentPayload = {
  name: string;
  email: string;
  company_name: string;
  partnership_type: string;
  country_of_residence: string;
  whatsapp_phone: string;
  iata_number?: string;
  geographical_location?: string;
  work_phone?: string;
  assigned_plan_ids?: number[];
};

export const createAgentApi = async (data: CreateAgentPayload & { tempPassword?: string }) => {
  return apiPost<{ id: number; email: string; tempPassword: string; message: string }>(
    "/admin/create-agent",
    data
  );
};

export type SubAgentItem = {
  id: number;
  name: string;
  email: string;
  status: string;
  work_phone?: string | null;
  whatsapp_phone?: string | null;
  created_at?: string;
  assigned_plan_ids?: number[];
  type?: 'agent' | 'sub_agent';
  sub_agents?: SubAgentItem[];
};

export type AgentProfile = {
  id: number;
  name: string;
  email: string;
  status: string;
  force_password_change?: number;
  last_login?: string | null;
  created_at?: string;
  company_name?: string | null;
  partnership_type?: string | null;
  country_of_residence?: string | null;
  iata_number?: string | null;
  geographical_location?: string | null;
  work_phone?: string | null;
  whatsapp_phone?: string | null;
  assigned_plan_ids?: number[];
  parent_agent_id?: number | null;
  type?: 'supervisor' | 'agent' | 'sub_agent';
  sub_agents?: SubAgentItem[];
};

export type CreateSubAgentPayload = {
  first_name: string;
  last_name: string;
  email: string;
  work_phone?: string;
  whatsapp_phone: string;
  assigned_plan_ids: number[];
};

export const createSubAgentApi = async (agentId: string, data: CreateSubAgentPayload) => {
  const res = await apiPost<{ success: boolean; data: { id: number; email: string; tempPassword: string }; message: string }>(
    `/admin/agents/${agentId}/sub-agents`,
    data
  );
  return res as any;
};

export const getAgentApi = async (id: string) => {
  const res = await apiGet<{ success: boolean; data: AgentProfile }>(`/admin/agents/${id}`);
  return (res as any).data;
};

export const updateAgentApi = async (id: string, data: Partial<CreateAgentPayload>) => {
  return apiPatch<{ success: boolean; message: string; code?: string }>(`/admin/agents/${id}`, data);
};

export const checkEmailAvailableApi = async (email: string, excludeUserId?: string | number) => {
  const params = new URLSearchParams({ email: email.trim() });
  if (excludeUserId != null && String(excludeUserId).trim() !== "") {
    params.set("excludeUserId", String(excludeUserId));
  }
  return apiGet<{
    success: boolean;
    available: boolean;
    message?: string;
    code?: string;
  }>(`/admin/email-available?${params.toString()}`);
};

/** Deletes supervisor + all agents + sub-agents, or agent + sub-agents, or a single sub-agent. Removes their cases (and linked sales). */
export const deleteAgentHierarchyApi = async (id: string) => {
  return apiDelete<{ success: boolean; message: string; deletedCount?: number }>(`/admin/agents/${id}`);
};

export const listAgentsApi = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  
  const queryString = queryParams.toString();
  const url = queryString ? `/admin/list-agents?${queryString}` : '/admin/list-agents';
  
  return apiGet(url);
};


export const updateUserStatusApi = async (userId: string, status: "active" | "inactive") => {
  return apiPatch<{ message: string }>("/admin/users/status", { userId, status });
};

export const sendPasswordResetLinkApi = async (userId: string) => {
  return apiPost<{ success: boolean; message: string; tempPassword: string }>("/admin/send-reset-link", { userId });
};

export type SubAdminItem = {
  id: number;
  name: string;
  email: string;
  status: string;
  force_password_change: boolean;
  last_login: string | null;
  created_at: string;
  work_phone: string | null;
  whatsapp_phone: string | null;
  owned_agency_count: number;
};

export type CreateSubAdminPayload = {
  first_name: string;
  last_name: string;
  email: string;
  work_phone?: string;
  whatsapp_phone?: string;
  tempPassword?: string;
};

export const listSubAdminsApi = async () => {
  const res = await apiGet<{ success: boolean; data: SubAdminItem[] }>("/admin/sub-admins");
  return (res as any).data as SubAdminItem[];
};

export const createSubAdminApi = async (data: CreateSubAdminPayload) => {
  return apiPost<{
    success: boolean;
    data: { id: number; email: string; tempPassword: string };
    message: string;
  }>("/admin/create-sub-admin", data);
};

export const deleteSubAdminApi = async (id: number) => {
  return apiDelete<{ success: boolean; message: string }>(`/admin/sub-admins/${id}`);
};

export type SupervisionHistoryItem = {
  id: number;
  agency_user_id: number;
  supervisor_user_id: number | null;
  supervisor_name: string | null;
  supervisor_email: string | null;
  supervisor_role: string | null;
  effective_from: string;
  effective_to: string | null;
  changed_by_user_id: number;
  changed_by_name: string | null;
  changed_by_email: string | null;
  reason: string | null;
  created_at: string;
  is_current: boolean;
};

export type ReassignSupervisorPayload = {
  supervisor_user_id: number;
  effective_from?: string;
  reason?: string;
};

/** Admin-only: reassign top-level agency to another supervising account. */
export const reassignAgentSupervisorApi = async (
  agencyId: string,
  data: ReassignSupervisorPayload
) => {
  return apiPatch<{
    success: boolean;
    message: string;
    data: {
      agency: {
        id: number;
        name: string;
        company_name: string | null;
        supervisor_user_id: number | null;
        supervisor_name: string | null;
      };
      history: SupervisionHistoryItem[];
    };
  }>(`/admin/agents/${agencyId}/supervisor`, data);
};

/** Admin-only: management periods for a partner / travel agency. */
export const getAgentSupervisionHistoryApi = async (agencyId: string) => {
  const res = await apiGet<{
    success: boolean;
    data: {
      agency: {
        id: number;
        name: string;
        company_name: string | null;
        supervisor_user_id: number | null;
        supervisor_name: string | null;
      };
      history: SupervisionHistoryItem[];
    };
  }>(`/admin/agents/${agencyId}/supervision-history`);
  return (res as any).data as {
    agency: {
      id: number;
      name: string;
      company_name: string | null;
      supervisor_user_id: number | null;
      supervisor_name: string | null;
    };
    history: SupervisionHistoryItem[];
  };
};

export const getAgentDashboardApi = async () => {
  const res = await apiGet("/users/dashboard");
  return (res as any).data;
};

export const getProfileApi = async () => {
  const res = await apiGet("/users/profile");
  return (res as any).data;
};

export const updateProfileApi = async (name: string) => {
  return apiPatch<{ success: boolean; message: string }>("/users/profile", { name });
};

export const changePasswordApi = async (currentPassword: string, newPassword: string) => {
  return apiPatch<{ success: boolean; message: string }>("/users/change-password", { 
    currentPassword, 
    newPassword 
  });
};