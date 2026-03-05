// src/lib/api.ts
import axios from "axios";
import i18n from "../i18n"; 

// Use environment variable for API URL with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://backend.acareeracademy.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // required for CORS when backend uses credentials: true
});


// Attach token automatically to every request
api.interceptors.request.use((config) => {
    // Get token from sessionManager
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  const lang = localStorage.getItem("lang") || i18n.language || "en";
  config.headers["Accept-Language"] = lang;
    return config;
  });
  
  // Handle 401 Unauthorized responses globally
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear all auth data using sessionManager
        import('../utils/sessionManager').then(({ sessionManager }) => {
          sessionManager.clearSession();
        });
        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn("Rate limit exceeded. Please wait before making another request.");
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
