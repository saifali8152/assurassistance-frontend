// lib/api.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});


// Attach token automatically to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
  // Handle 401 Unauthorized responses globally
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login"; // Redirect to login if token expired
      }
      return Promise.reject(error);
    }
  );

//  helpers for all methods
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

export const apiPatch = async <T>(url: string, data: any): Promise<T> => {
  const res = await api.patch<T>(url, data);
  return res.data;
};


export default api;
