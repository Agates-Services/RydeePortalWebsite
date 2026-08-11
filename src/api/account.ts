import { joinUrl, post } from "./client";

export const API_CHANGE_PASSWORD_URL = joinUrl("/change-password");

export interface ChangePasswordPayload {
  phone: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  error?: string;
}

export function changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResponse> {
  return post<ChangePasswordResponse>(API_CHANGE_PASSWORD_URL, payload);
}
