import { apiPost, apiGet, apiPatch } from "../lib/api";

export const createAgentApi = async (data: { name: string; email: string }) => {
  return apiPost<{ id: number; email: string; tempPassword: string; message: string }>(
    "/admin/create-agent",
    data
  );
};

export const listAgentsApi = async () => {
  return apiGet("/admin/list-agents");
};


export const updateUserStatusApi = async (userId: string, status: "active" | "inactive") => {
  return apiPatch<{ message: string }>("/admin/users/status", { userId, status });
};