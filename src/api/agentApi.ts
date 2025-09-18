import { apiPost, apiGet } from "../lib/api";

export const createAgentApi = async (data: { name: string; email: string }) => {
  return apiPost<{ id: number; email: string; tempPassword: string; message: string }>(
    "/admin/create-agent",
    data
  );
};

export const listAgentsApi = async () => {
  return apiGet("/admin/list-agents");
};
