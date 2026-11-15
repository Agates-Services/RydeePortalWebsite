import type { UserRole, UserStatus, UsersRow } from "./types";

const KNOWN_ROLES: readonly UserRole[] = ["Admin", "Operator"];

function normaliseRole(raw: unknown): UserRole | null {
  if (typeof raw !== "string") return null;
  const lower = raw.trim().toLowerCase();
  const match = KNOWN_ROLES.find((r) => r.toLowerCase() === lower);
  return match ?? null;
}

function str(raw: Record<string, unknown>, key: string): string {
  const v = raw[key];
  return typeof v === "string" ? v : "";
}

function normaliseStatus(raw: unknown): UserStatus {
  const v = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return v === "BLOCKED" || v === "DISABLED" ? "disabled" : "active";
}

export function toUsersRow(raw: Record<string, unknown>, idx: number): UsersRow | null {
  const role = normaliseRole(raw.role);
  if (!role) return null;
  const id = typeof raw.id === "number" ? raw.id : idx + 1;
  return {
    id,
    name: str(raw, "name"),
    phone: str(raw, "phone"),
    email: str(raw, "email"),
    role,
    area: str(raw, "area"),
    joinedAt: str(raw, "joinedAt"),
    status: normaliseStatus(raw.activationStatus ?? raw.activation_status),
  };
}

export function mapUsersResponse(rows: ReadonlyArray<Record<string, unknown>>): UsersRow[] {
  const out: UsersRow[] = [];
  rows.forEach((r, i) => {
    const row = toUsersRow(r, i);
    if (row) out.push(row);
  });
  return out;
}
