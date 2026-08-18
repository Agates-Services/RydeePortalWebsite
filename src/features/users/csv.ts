import { serializeCsv, downloadCsv as downloadCsvLib } from "@/lib/csv";
import type { UsersRow } from "./types";

const HEADERS = ["Name", "Phone", "Email", "Role", "Area", "Joined"] as const;

export function usersToCsv(rows: readonly UsersRow[]): string {
  const body = rows.map((r) => [r.name, r.phone, r.email, r.role, r.area, r.joinedAt]);
  return serializeCsv(HEADERS, body);
}

function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function usersCsvFilename(tab: string, now: Date = new Date()): string {
  return `rydee-users-${tab}-${todayIso(now)}.csv`;
}

export const downloadCsv = downloadCsvLib;
