import { EndpointNotAvailableError, joinUrl, post } from "./client";

export const API_GET_RIDES_URL = joinUrl("/get-rides");
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
}

export interface GetRidesResponse {
  rides: Ride[];
  total: number;
  counts: RidesCounts;
}

export interface GetRideResponse {
  ride: Ride;
}

export function getRides(body: GetRidesRequest): Promise<GetRidesResponse> {
  return post<GetRidesResponse>(API_GET_RIDES_URL, body);
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
