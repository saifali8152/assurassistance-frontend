// src/api/authApi.ts
import { apiPost } from "../lib/api"; // Fix path
import type { LoginRequest, LoginResponse } from "./interfaces";

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  return apiPost<LoginResponse>("/auth/login", data);
};

export const changePasswordApi = async (data: { oldPassword: string; newPassword: string }) => {
  return apiPost("/auth/change-password", data);
};
