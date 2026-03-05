import { apiGet, apiPatch } from "../lib/api";

export const getAdminDashboardApi = async () => {
  const res = await apiGet("/admin/dashboard");
  return (res as any).data; // <-- return the .data property
};

export const getProductionTrendApi = async () => {
  const res = await apiGet("/admin/production-trend");
  return (res as any).data;
};

export const getAdminProfileApi = async () => {
  const res = await apiGet("/admin/profile");
  return (res as any).data;
};

export const updateAdminProfileApi = async (name: string) => {
  try {
    const response = await apiPatch<{ success: boolean; message: string }>("/admin/profile", { name });
    console.log("Admin API Response:", response); // Debug log
    return response;
  } catch (error) {
    console.error("Admin API Error:", error); // Debug log
    throw error;
  }
};

export const changeAdminPasswordApi = async (currentPassword: string, newPassword: string) => {
  return apiPatch<{ success: boolean; message: string }>("/admin/change-password", { 
    currentPassword, 
    newPassword 
  });
};