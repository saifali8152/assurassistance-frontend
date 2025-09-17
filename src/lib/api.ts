// lib/api.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Generic helpers for all methods
export const apiGet = async <T>(url: string): Promise<T> => {
  const res = await api.get<T>(url);
  return res.data;
};

export const apiPost = async <T>(url: string, data: any): Promise<T> => {
  const res = await api.post<T>(url, data);
  return res.data;
};

export const apiPut = async <T>(url: string, data: any): Promise<T> => {
  const res = await api.put<T>(url, data);
  return res.data;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const res = await api.delete<T>(url);
  return res.data;
};

export default api;
