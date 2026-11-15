import { EndpointNotAvailableError, joinUrl, post } from "./client";

export const API_GET_ALL_USERS_URL = joinUrl("/get-all-users");

interface WireUser {
  role?: unknown;
  profile?: unknown;
  [key: string]: unknown;
}

function flattenUser(u: WireUser): Record<string, unknown> {
  const profile = u.profile;
  if (!profile || typeof profile !== "object") {
    return u as Record<string, unknown>;
  }
  const flat: Record<string, unknown> = { ...(profile as Record<string, unknown>) };
  if (typeof u.role !== "undefined" && !("role" in flat)) flat.role = u.role;
  if (typeof flat.joinedAt === "undefined" && typeof flat.dateOfJoining === "string") {
    flat.joinedAt = String(flat.dateOfJoining);
  }
  return flat;
}

export interface UsersResponse {
  users: Array<Record<string, unknown>>;
}

export async function getAllUsers(callerRole: string): Promise<UsersResponse> {
  const raw = await post<{ users?: unknown }>(API_GET_ALL_USERS_URL, { role: callerRole });
  if (!raw || !Array.isArray(raw.users)) return { users: [] };
  return { users: (raw.users as WireUser[]).map(flattenUser) };
}

// There is no delete-user endpoint in docs/design/API-Document-V1.pdf yet, so this always fails
// with EndpointNotAvailableError and the page tells the admin. When the backend adds it, replace
// the body with a post() call that sends the user's phone, and add a matching mock handler.
export async function deleteUser(phone: string): Promise<void> {
  void phone;
  throw new EndpointNotAvailableError("delete-user");
}
