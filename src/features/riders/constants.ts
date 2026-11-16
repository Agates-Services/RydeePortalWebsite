// User-interface constants for rider forms (Karachi area picker plus the verification-document checklist).
import type { StatusTone } from "@/components/StatusBadge";
import type { RiderStatus } from "@/types/rider";

export const KARACHI_AREAS = [
  "Clifton",
  "DHA Phase 1",
  "DHA Phase 6",
  "Gulshan-e-Iqbal",
  "PECHS",
  "Saddar",
  "North Nazimabad",
  "Malir",
  "Korangi",
  "Orangi Town",
  "Landhi",
  "Lyari",
  "Gulistan-e-Johar",
  "Federal B Area",
  "Bahadurabad",
];

export const VERIFICATION_DOCS = [
  "CNIC Copy",
  "Profile Photo",
  "Bike Registration",
  "Driving License",
  "Utility Bill",
];

export const RIDER_STATUS_TONE: Record<RiderStatus, StatusTone> = {
  active: "success",
  pending: "warning",
  blocked: "danger",
  offboarded: "neutral",
};
