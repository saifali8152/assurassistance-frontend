//src/agentApi.ts
import { apiPost, apiGet, apiPatch } from "../lib/api";

export const createAgentApi = async (data: { name: string; email: string }) => {
  return apiPost<{ id: number; email: string; tempPassword: string; message: string }>(
    "/admin/create-agent",
    data
  );
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