// src/api/authApi.ts
import { apiPost } from "../lib/api"; // Fix path
import type { LoginRequest, LoginResponse } from "./interfaces";

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  return apiPost<LoginResponse>("/auth/login", data);
};

export const changePasswordApi = async (data: { oldPassword: string; newPassword: string }) => {
  return apiPost("/auth/change-password", data);
};

// Forgot Password APIs
export const sendResetCodeApi = async (data: { email: string }) => {
  return apiPost("/auth/forgot-password", data);
};

export const verifyResetCodeApi = async (data: { email: string; code: string }) => {
  return apiPost("/auth/verify-reset-code", data);
};

export const resetPasswordApi = async (data: { email: string; code: string; newPassword: string }) => {
  return apiPost("/auth/reset-password", data);
};

