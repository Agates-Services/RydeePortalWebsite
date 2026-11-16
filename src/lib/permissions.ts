export type PortalAction =
  | "manageStaffUsers"
  | "addRider"
  | "editRider"
  | "blockRider"
  | "deleteRider"
  | "editRide"
  | "deleteRide";

const OPERATOR_ALLOWED: ReadonlySet<PortalAction> = new Set(["addRider", "editRider", "editRide"]);

export function can(role: string | null | undefined, action: PortalAction): boolean {
  const r = (role ?? "").toLowerCase();
  if (r === "admin") return true;
  if (r === "operator") return OPERATOR_ALLOWED.has(action);
  return false;
}
