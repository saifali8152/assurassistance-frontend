//src/api/catalogueApi.ts
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

export const getAllCataloguesApi = () => apiGet("/catalogue");
export const createCatalogueApi = (data: any) => apiPost("/catalogue", data);
export const updateCatalogueApi = (id: number, data: any) => apiPut(`/catalogue/${id}`, data);
export const deleteCatalogueApi = (id: number) => apiDelete(`/catalogue/${id}`);
