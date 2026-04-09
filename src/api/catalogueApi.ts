//src/api/catalogueApi.ts
import { apiGet, apiPost, apiPut, apiDelete, apiPostFormData } from "../lib/api";

export const getAllCataloguesApi = () => apiGet("/catalogue");
export const createCatalogueApi = (data: any) => apiPost("/catalogue", data);
export const updateCatalogueApi = (id: number, data: any) => apiPut(`/catalogue/${id}`, data);
export const deleteCatalogueApi = (id: number) => apiDelete(`/catalogue/${id}`);

export const uploadPlanPartnerLogoApi = (id: number, file: File) => {
  const fd = new FormData();
  fd.append("partner_logo", file);
  return apiPostFormData<{
    success: boolean;
    partner_insurer_logo?: string;
    partnerLogoUrl?: string;
    message?: string;
  }>(`/catalogue/${id}/partner-logo`, fd);
};

export const deletePlanPartnerLogoApi = (id: number) =>
  apiDelete<{ success: boolean; message?: string }>(`/catalogue/${id}/partner-logo`);
