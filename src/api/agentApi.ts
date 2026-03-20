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
  return apiPatch<{ success: boolean; message: string }>(`/admin/agents/${id}`, data);
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