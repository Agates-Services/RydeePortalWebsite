import { joinUrl, post } from "./client";
import type { Profile } from "@/types/profile";

export const API_LOGIN_URL = joinUrl("/user-login");
export const API_REGISTER_URL = joinUrl("/register-user");

export interface LoginResult {
  userId: string | null;
  accessToken: string | null;
  role: string;
  profile: Profile;
}

interface RegisterPayload {
  name: string;
  email?: string;
  phone: string;
  dob: string;
  address: string;
  password: string;
  role: string;
}

function titleCase(role: string): string {
  return role.length === 0 ? role : role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export async function login(phone: string, password: string): Promise<LoginResult> {
  const raw = await post<{
    user_id?: unknown;
    userId?: unknown;
    accessToken?: unknown;
    role?: string;
    profile?: Partial<Profile> & { role?: string };
  }>(API_LOGIN_URL, { phone, password });
  const rawProfileRole = raw.profile?.role;
  const topRole = raw.role ?? "";
  const canonical = titleCase(
    typeof rawProfileRole === "string" && rawProfileRole !== "" ? rawProfileRole : topRole,
  );
  const profile = { ...(raw.profile ?? {}), role: canonical } as Profile;
  const rawId = raw.user_id ?? raw.userId;
  const userId = typeof rawId === "string" ? rawId : null;
  const accessToken = typeof raw.accessToken === "string" ? raw.accessToken : null;
  return { userId, accessToken, role: canonical, profile };
}

export function registerUser(payload: RegisterPayload): Promise<unknown> {
  return post<unknown>(API_REGISTER_URL, payload);
}
