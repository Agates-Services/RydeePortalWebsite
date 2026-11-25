import { EndpointNotAvailableError, joinUrl, post } from "./client";

export const API_GET_RIDES_URL = joinUrl("/get-rides");
export const API_GET_ALL_TRIPS_URL = joinUrl("/get-all-trips");
export const API_GET_DRIVER_TRIPS_URL = joinUrl("/get-driver-trips");
export const API_GET_RIDE_URL = joinUrl("/get-ride");
export const API_GET_RIDES_SUMMARY_URL = joinUrl("/get-rides-summary");

export const LIVE_POLL_MS = 12_000;

export type RideTab = "live" | "upcoming" | "completed" | "canceled";

export type RideStatus =
  | "going_to_pick"
  | "waiting_for_ride"
  | "in_transit"
  | "arrived"
  | "scheduled"
  | "completed"
  | "canceled";

export interface RideParty {
  name: string;
  phone: string;
}

export interface RidePlace {
  label: string;
  lat: number;
  lng: number;
}

export interface RideFare {
  amount: number;
  currency: string;
}

export interface RideLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

export interface RideEta {
  minutes: number;
  distanceKm: number;
}

export interface Ride {
  rideId: string;
  status: RideStatus;
  rider: RideParty;
  customer: RideParty;
  pickup: RidePlace;
  dropoff: RidePlace;
  startedAt?: string;
  scheduledAt?: string;
  completedAt?: string;
  canceledAt?: string;
  canceledBy?: "rider" | "customer";
  cancelReason?: string;
  fare?: RideFare;
  riderLocation?: RideLocation;
  eta?: RideEta;
  routePolyline?: string;
  traveledPath?: string;
  plannedDistanceKm?: number;
  traveledDistanceKm?: number;
  waitingMinutes?: number;
}

export interface RidesCounts {
  live: number;
  upcoming: number;
  completed: number;
  canceled: number;
}

export type RideSortKey =
  | "rideId"
  | "status"
  | "riderName"
  | "customerName"
  | "pickupLabel"
  | "dropoffLabel"
  | "fareAmount"
  | "startedAt"
  | "scheduledAt"
  | "completedAt"
  | "duration"
  | "canceledAt"
  | "canceledBy";

export type RideSortDir = "asc" | "desc";

export type RidesScope = "mine" | "all";

export interface GetRidesRequest {
  tab: RideTab;
  page?: number;
  pageSize?: number;
  sortBy?: RideSortKey;
  sortDir?: RideSortDir;
  scope?: RidesScope;
  phone?: string;
  userId?: string;
}

export interface GetRidesResponse {
  rides: Ride[];
  total: number;
  counts: RidesCounts;
}

export interface GetRideResponse {
  ride: Ride;
}

interface TripLocationWire {
  address?: unknown;
  lat?: unknown;
  lon?: unknown;
  long?: unknown;
}

interface TripWire {
  rideId?: unknown;
  ride_id?: unknown;
  tripId?: unknown;
  trip_id?: unknown;
  id?: unknown;
  cust?: {
    name?: unknown;
    phone?: unknown;
    origin?: TripLocationWire;
    dest?: TripLocationWire;
  };
  driverInfo?: {
    id?: unknown;
    name?: unknown;
    phone?: unknown;
  };
  created_at?: unknown;
  status?: unknown;
  comment?: unknown;
  fare?: unknown;
}

function tripStatus(value: unknown): RideStatus {
  const status = typeof value === "string"
    ? value.trim().toUpperCase().replace(/[\s-]+/g, "_")
    : "";
  if (["COMPLETED", "COMPLETE"].includes(status)) return "completed";
  if (["CANCELED", "CANCELLED"].includes(status)) return "canceled";
  if (["IN_TRANSIT", "ONGOING", "STARTED"].includes(status)) return "in_transit";
  if (status === "ARRIVED") return "arrived";
  if (["WAITING", "WAITING_FOR_RIDE"].includes(status)) return "waiting_for_ride";
  if (["GOING_TO_PICK", "GOING_TO_PICKUP", "PICKUP"].includes(status)) return "going_to_pick";
  if (["PENDING", "CONFIRMED", "REQUESTED", "SCHEDULED"].includes(status)) return "scheduled";
  return "scheduled";
}

function mapTrip(raw: unknown, index: number): Ride | null {
  if (!raw || typeof raw !== "object") return null;
  const trip = raw as TripWire;
  const pickup = trip.cust?.origin;
  const dropoff = trip.cust?.dest;
  const status = tripStatus(trip.status);
  const createdAt = typeof trip.created_at === "string" ? trip.created_at : undefined;
  const rawId = trip.rideId ?? trip.ride_id ?? trip.tripId ?? trip.trip_id ?? trip.id;
  const rideId = typeof rawId === "string" && rawId !== "" ? rawId : `TRIP-${createdAt ?? index}-${index}`;

  return {
    rideId,
    status,
    rider: {
      name: typeof trip.driverInfo?.name === "string" ? trip.driverInfo.name : "",
      phone: typeof trip.driverInfo?.phone === "string" ? trip.driverInfo.phone : "",
    },
    customer: {
      name: typeof trip.cust?.name === "string" ? trip.cust.name : "",
      phone: typeof trip.cust?.phone === "string" ? trip.cust.phone : "",
    },
    pickup: {
      label: typeof pickup?.address === "string" ? pickup.address : "",
      lat: typeof pickup?.lat === "number" ? pickup.lat : 0,
      lng: typeof pickup?.lon === "number" ? pickup.lon : typeof pickup?.long === "number" ? pickup.long : 0,
    },
    dropoff: {
      label: typeof dropoff?.address === "string" ? dropoff.address : "",
      lat: typeof dropoff?.lat === "number" ? dropoff.lat : 0,
      lng: typeof dropoff?.lon === "number" ? dropoff.lon : typeof dropoff?.long === "number" ? dropoff.long : 0,
    },
    ...(status === "completed"
      ? { completedAt: createdAt }
      : status === "canceled"
        ? { canceledAt: createdAt, cancelReason: typeof trip.comment === "string" ? trip.comment : undefined }
        : status === "scheduled"
          ? { scheduledAt: createdAt }
          : { startedAt: createdAt }),
    ...(typeof trip.fare === "number" ? { fare: { amount: trip.fare, currency: "PKR" } } : {}),
  };
}

export async function getRides(body: GetRidesRequest): Promise<GetRidesResponse> {
  const raw = body.scope === "mine"
    ? await post<{ success?: unknown; rides?: unknown; trips?: unknown }>(API_GET_DRIVER_TRIPS_URL, {
        userId: body.userId ?? body.phone,
        phone: body.phone,
      })
    : await post<{ success?: unknown; rides?: unknown; trips?: unknown }>(API_GET_ALL_TRIPS_URL, {});

  const tripRows = Array.isArray(raw.trips)
    ? raw.trips
    : Array.isArray(raw.rides)
      ? raw.rides
      : [];
  const rides = tripRows.map(mapTrip).filter((ride): ride is Ride => ride !== null);

  const tabRides = rides.filter((ride) => {
    if (body.tab === "live") {
      return ride.status === "going_to_pick" || ride.status === "waiting_for_ride" || ride.status === "in_transit" || ride.status === "arrived";
    }
    if (body.tab === "upcoming") return ride.status === "scheduled";
    if (body.tab === "completed") return ride.status === "completed";
    return ride.status === "canceled";
  });

  const counts: RidesCounts = {
    live: rides.filter((ride) => ["going_to_pick", "waiting_for_ride", "in_transit", "arrived"].includes(ride.status)).length,
    upcoming: rides.filter((ride) => ride.status === "scheduled").length,
    completed: rides.filter((ride) => ride.status === "completed").length,
    canceled: rides.filter((ride) => ride.status === "canceled").length,
  };

  const sorted = sortTrips(tabRides, body.sortBy, body.sortDir);
  const page = typeof body.page === "number" && body.page > 0 ? body.page : 1;
  const pageSize = typeof body.pageSize === "number" && body.pageSize > 0 ? body.pageSize : tabRides.length;
  const start = (page - 1) * pageSize;

  return {
    rides: sorted.slice(start, start + pageSize),
    total: sorted.length,
    counts,
  };
}

export interface GetRideRequest {
  rideId: string;
  scope?: RidesScope;
  phone?: string;
}

export function getRide(body: GetRideRequest): Promise<GetRideResponse> {
  return post<GetRideResponse>(API_GET_RIDE_URL, body);
}

export interface RidesAreaCount {
  label: string;
  rides: number;
}

export interface RidesMonthlyPoint {
  month: string;
  completed: number;
  canceled: number;
}

export interface RidesSummary {
  completedTotal: number;
  canceledTotal: number;
  liveTotal: number;
  upcomingTotal: number;
  areas: RidesAreaCount[];
  monthly: RidesMonthlyPoint[];
}

export function getRidesSummary(): Promise<RidesSummary> {
  return post<RidesSummary>(API_GET_RIDES_SUMMARY_URL, {});
}

export interface RideChanges {
  pickupLabel?: string;
  dropoffLabel?: string;
  fareAmount?: number;
}

// There is no update-ride or delete-ride endpoint in docs/design/API-Document-V1.pdf yet, so both
// functions fail with EndpointNotAvailableError and the Rides page tells the user. When the backend
// adds them, replace each body with a post() call and add matching mock handlers.
export async function updateRide(rideId: string, changes: RideChanges): Promise<void> {
  void rideId;
  void changes;
  throw new EndpointNotAvailableError("update-ride");
}

export async function deleteRide(rideId: string): Promise<void> {
  void rideId;
  throw new EndpointNotAvailableError("delete-ride");
}

function tripTime(ride: Ride): number {
  const value = ride.completedAt ?? ride.startedAt ?? ride.scheduledAt ?? ride.canceledAt;
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function sortTrips(trips: Ride[], sortBy?: RideSortKey, sortDir?: RideSortDir): Ride[] {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...trips].sort((a, b) => {
    let result: number;
    switch (sortBy) {
      case "rideId": result = a.rideId.localeCompare(b.rideId, undefined, { numeric: true }); break;
      case "status": result = a.status.localeCompare(b.status); break;
      case "riderName": result = a.rider.name.localeCompare(b.rider.name); break;
      case "customerName": result = a.customer.name.localeCompare(b.customer.name); break;
      case "pickupLabel": result = a.pickup.label.localeCompare(b.pickup.label); break;
      case "dropoffLabel": result = a.dropoff.label.localeCompare(b.dropoff.label); break;
      case "fareAmount": result = (a.fare?.amount ?? 0) - (b.fare?.amount ?? 0); break;
      case "startedAt": result = (a.startedAt ? new Date(a.startedAt).getTime() : 0) - (b.startedAt ? new Date(b.startedAt).getTime() : 0); break;
      case "scheduledAt": result = (a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0) - (b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0); break;
      case "completedAt": result = (a.completedAt ? new Date(a.completedAt).getTime() : 0) - (b.completedAt ? new Date(b.completedAt).getTime() : 0); break;
      case "duration": result = ((a.completedAt && a.startedAt ? new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime() : 0) - (b.completedAt && b.startedAt ? new Date(b.completedAt).getTime() - new Date(b.startedAt).getTime() : 0)); break;
      case "canceledAt": result = (a.canceledAt ? new Date(a.canceledAt).getTime() : 0) - (b.canceledAt ? new Date(b.canceledAt).getTime() : 0); break;
      case "canceledBy": result = (a.canceledBy ?? "").localeCompare(b.canceledBy ?? ""); break;
      default: result = tripTime(a) - tripTime(b);
    }
    if (result === 0) result = a.rideId.localeCompare(b.rideId, undefined, { numeric: true });
    return sortBy === undefined ? -result : dir * result;
  });
}
