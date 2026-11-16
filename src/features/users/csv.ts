import { serializeCsv, downloadCsv as downloadCsvLib } from "@/lib/csv";
import type { UsersRow } from "./types";

export const USERS_EXPORT_HEADERS = ["Name", "Phone", "Email", "Role", "Status", "Area", "Joined"] as const;

export function usersToExportRows(rows: readonly UsersRow[]): string[][] {
  return rows.map((r) => [
    r.name,
    r.phone,
    r.email,
    r.role,
    r.status === "disabled" ? "Disabled" : "Active",
    r.area,
    r.joinedAt,
  ]);
}

export function usersToCsv(rows: readonly UsersRow[]): string {
  return serializeCsv(USERS_EXPORT_HEADERS, usersToExportRows(rows));
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

export function usersPdfFilename(tab: string, now: Date = new Date()): string {
  return `rydee-users-${tab}-${todayIso(now)}.pdf`;
}

export const downloadCsv = downloadCsvLib;
