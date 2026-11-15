import type { Ride, RideStatus } from "@/api/rides";

const STATUS_LABEL: Record<RideStatus, string> = {
  going_to_pick: "Going to pick",
  waiting_for_ride: "Waiting for ride",
  in_transit: "In transit",
  arrived: "Arrived",
  scheduled: "Scheduled",
  completed: "Completed",
  canceled: "Canceled",
};

export const RIDES_EXPORT_HEADERS = [
  "Ride ID",
  "Status",
  "Rider",
  "Rider phone",
  "Customer",
  "Customer phone",
  "Pickup",
  "Drop-off",
  "Fare",
  "Started",
  "Completed / canceled",
  "Canceled by",
] as const;

export function rideDate(ride: Ride): string | undefined {
  return ride.completedAt ?? ride.canceledAt ?? ride.startedAt ?? ride.scheduledAt;
}

function dateTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-GB");
}

export function ridesToExportRows(rides: readonly Ride[]): string[][] {
  return rides.map((r) => [
    r.rideId,
    STATUS_LABEL[r.status],
    r.rider.name,
    r.rider.phone,
    r.customer.name,
    r.customer.phone,
    r.pickup.label,
    r.dropoff.label,
    r.fare ? `${r.fare.currency} ${r.fare.amount}` : "",
    dateTime(r.startedAt ?? r.scheduledAt),
    dateTime(r.completedAt ?? r.canceledAt),
    r.canceledBy ?? "",
  ]);
}

export function ridesExportFilename(name: string, extension: "csv" | "pdf", now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `rydee-rides-${name}-${y}-${m}-${d}.${extension}`;
}
