import { apiGet } from "../lib/api";

export const getAdminDashboardApi = async () => {
  const res = await apiGet("/admin/dashboard");
  return res.data; // <-- return the .data property
};
