import { joinUrl, post } from "./client";

export const API_GET_ALL_RIDERS_URL = joinUrl("/get-all-riders");
export const API_ACTIVATE_RIDER_URL = joinUrl("/activate-rider");
export const API_UPDATE_USER_URL = joinUrl("/update-user");
export const API_RESET_RIDER_PIN_URL = joinUrl("/reset-rider-pin");

interface RidersResponse {
  riders?: Array<Record<string, unknown>>;
}

interface WireRider {
  userId?: unknown;
  role?: unknown;
  profile?: unknown;
  [key: string]: unknown;
}

function flattenRider(r: WireRider): Record<string, unknown> {
  const profile = r.profile;
  if (!profile || typeof profile !== "object") {
    return r as Record<string, unknown>;
  }
  const flat: Record<string, unknown> = { ...(profile as Record<string, unknown>) };
  flat.rawProfile = profile;
  if (typeof r.userId !== "undefined" && !("userId" in flat)) flat.userId = r.userId;
  if (typeof r.role !== "undefined" && !("role" in flat)) flat.role = r.role;
  // Map new dateOfJoining onto the joinedAt field the mapper/UI already consume.
  if (typeof flat.joinedAt === "undefined" && typeof flat.dateOfJoining === "string") {
    flat.joinedAt = String(flat.dateOfJoining);
  }
  // Backend emits UPPERCASE activationStatus (PENDING/ACTIVE); the app works in
  // lowercase everywhere, so normalise once at the boundary.
  if (typeof flat.activationStatus === "string") {
    flat.activationStatus = flat.activationStatus.toLowerCase();
  }
  // Backend moved cnic under profile.documents.cnic; lift it to the flat cnic
  // field the mapper/UI consume, keeping any legacy top-level cnic as fallback.
  const docs = flat.documents;
  if (
    docs &&
    typeof docs === "object" &&
    typeof (docs as Record<string, unknown>).cnic === "string"
  ) {
    flat.cnic = (docs as Record<string, unknown>).cnic;
  }
  return flat;
}

function normalise(res: { riders?: unknown }): RidersResponse {
  if (!res || !Array.isArray(res.riders)) return { riders: [] };
  return {
    riders: (res.riders as WireRider[]).map(flattenRider),
  };
}

export async function getAllRiders(): Promise<RidersResponse> {
  const raw = await post<{ riders?: unknown }>(API_GET_ALL_RIDERS_URL);
  return normalise(raw);
}

export interface ActivateRiderResponse {
  success: boolean;
  message?: string;
  error?: string;
  updatedFields?: { activation_status?: string };
}

export function activateRider(phone: string, pin: string): Promise<ActivateRiderResponse> {
  return post<ActivateRiderResponse>(API_ACTIVATE_RIDER_URL, { phone, pin });
}

export interface UpdateUserResponse {
  message: string;
  updatedFields?: Record<string, unknown>;
}

export function updateUser(
  phone: string,
  userId: string | null,
  patch: Record<string, unknown>,
): Promise<UpdateUserResponse> {
  return post<UpdateUserResponse>(API_UPDATE_USER_URL, { phone, userId, profile: patch });
}

export interface ResetRiderPinResponse {
  success: boolean;
  pin?: string;
  lastResetAt?: string;
  error?: string;
}

export function resetRiderPin(phone: string, role: string): Promise<ResetRiderPinResponse> {
  return post<ResetRiderPinResponse>(API_RESET_RIDER_PIN_URL, { phone, role });
}
