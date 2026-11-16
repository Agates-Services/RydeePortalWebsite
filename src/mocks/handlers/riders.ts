import { http, HttpResponse } from "msw";
import {
  API_ACTIVATE_RIDER_URL,
  API_GET_ALL_RIDERS_URL,
  API_UPDATE_USER_URL,
} from "@/api/riders";
import { patchStaffUser } from "./users";

interface RiderDocuments {
  cnic: string | null;
  license: string | null;
  vehicleRegistration: string | null;
  profilePicture: string | null;
  utilityBill: string | null;
}

interface RiderProfile {
  name: string;
  phone: string;
  role: "rider";
  area: string | null;
  address: string | null;
  rideState: string;
  dateOfJoining: string | null;
  dob: string | null;
  rideCount: number;
  totalRides: number;
  totalDistance: number;
  missedRides: number;
  rating: number;
  online: boolean;
  currentLocation: { lat: number; lon: number } | null;
  lastCustomerID: string | null;
  activationStatus: "PENDING" | "ACTIVE" | "BLOCKED" | "OFFBOARDED";
  documents: RiderDocuments;
  pin?: string;
  id?: number;
}

interface RiderRecord {
  userId: string;
  profile: RiderProfile;
}

function documentsWithCnic(cnic: string): RiderDocuments {
  return { cnic, license: null, vehicleRegistration: null, profilePicture: null, utilityBill: null };
}

function seed(
  id: number,
  name: string,
  phone: string,
  cnic: string,
  activationStatus: RiderProfile["activationStatus"],
  area: string | null,
  joined: string,
  currentLocation: { lat: number; lon: number } | null = null,
): RiderRecord {
  return {
    userId: `rider-${id}`,
    profile: {
      name,
      phone,
      role: "rider",
      area,
      address: null,
      rideState: "IDLE",
      dateOfJoining: joined,
      dob: null,
      rideCount: 0,
      totalRides: 0,
      totalDistance: 0,
      missedRides: 0,
      rating: 5,
      online: false,
      currentLocation,
      lastCustomerID: null,
      activationStatus,
      documents: documentsWithCnic(cnic),
      id,
    },
  };
}

const allRidersSeeds: RiderRecord[] = [
  seed(201, "Muhammad Imran", "0312-4561234", "42101-7654321-3", "PENDING", "DHA", "2026-07-20"),
  seed(202, "Alia Rehman", "0321-1234500", "42101-1111111-1", "ACTIVE", "Clifton", "2026-07-15", { lat: 24.8157, lon: 67.0235 }),
  seed(203, "Naveed Akhtar", "0321-9876543", "42201-1234567-1", "PENDING", "Gulshan-e-Iqbal", "2026-07-18"),
  seed(204, "Faisal Khan", "0300-9990001", "42301-2222222-2", "ACTIVE", "Saddar", "2026-07-10"),
  seed(205, "Shoaib Malik", "0333-1122334", "42301-9988776-5", "PENDING", "Nazimabad", "2026-07-22"),
  seed(206, "Rizwan Ghafoor", "0345-5544332", "42101-4433221-7", "BLOCKED", "Malir", "2026-06-30"),
  seed(207, "Danish Mehmood", "0300-7654321", "42401-6677889-2", "ACTIVE", "North Karachi", "2026-07-05", { lat: 24.87, lon: 67.05 }),
  seed(208, "Kashif Noor", "0311-2233445", "42501-1122334-9", "OFFBOARDED", "Korangi", "2026-05-12"),
  seed(209, "Sajid Iqbal", "0322-8877665", "42601-5566778-4", "ACTIVE", "Landhi", "2026-07-01", { lat: 24.82, lon: 67.13 }),
  seed(210, "Adnan Rasheed", "0343-3344556", "42101-2233445-6", "PENDING", "Orangi", "2026-07-25"),
  seed(211, "Usman Tariq", "0300-1111111", "42101-3344556-8", "ACTIVE", "Saddar", "2026-06-15", { lat: 24.8607, lon: 67.0011 }),
  seed(212, "Bilal Hussain", "0300-2222222", "42101-4455667-9", "BLOCKED", "Clifton", "2026-06-20"),
  seed(213, "Zain ul Abidin", "0300-3333333", "42101-5566778-1", "ACTIVE", "Gulshan-e-Iqbal", "2026-07-08", { lat: 24.9215, lon: 67.0897 }),
  seed(214, "Hamza Sheikh", "0333-4455667", "42101-6677889-3", "OFFBOARDED", "DHA", "2026-05-01"),
  seed(215, "Junaid Ali", "0345-7788990", "42101-7788990-4", "ACTIVE", "Nazimabad", "2026-07-12", { lat: 24.95, lon: 67.02 }),
  seed(216, "Tariq Mahmood", "0311-8899001", "42101-8899001-5", "PENDING", "PECHS", "2026-07-28"),
  seed(217, "Yasir Iqbal", "0322-9900112", "42101-9900112-6", "ACTIVE", "Gulistan-e-Johar", "2026-06-25", { lat: 24.89, lon: 67.2 }),
  seed(218, "Salman Farooq", "0343-0011223", "42101-0011223-7", "BLOCKED", "Malir", "2026-06-05"),
];

interface ActivateBody {
  phone?: string;
  pin?: string;
}

function normalisePhone(v: string): string {
  return v.replace(/\D/g, "");
}

function applyPatch(target: RiderProfile, patch: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(patch)) {
    if (key === "documents" && value && typeof value === "object") {
      target.documents = { ...target.documents, ...(value as Partial<RiderDocuments>) };
    } else if (key === "activationStatus" && typeof value === "string") {
      target.activationStatus = value.toUpperCase() as RiderProfile["activationStatus"];
    } else {
      (target as unknown as Record<string, unknown>)[key] = value;
    }
  }
}

export const ridersHandlers = [
  http.post(API_GET_ALL_RIDERS_URL, async () => {
    return HttpResponse.json({ success: true, riders: allRidersSeeds });
  }),
  http.post(API_ACTIVATE_RIDER_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as ActivateBody;
    const phone = typeof body.phone === "string" ? normalisePhone(body.phone) : "";
    const pin = typeof body.pin === "string" ? body.pin : "";
    if (!phone || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return HttpResponse.json(
        { success: false, error: "phone and 6-digit pin are required" },
        { status: 400 },
      );
    }
    const inAll = allRidersSeeds.find((s) => normalisePhone(s.profile.phone) === phone);
    if (!inAll) {
      return HttpResponse.json(
        { success: false, error: "User profile does not exist!" },
        { status: 404 },
      );
    }
    inAll.profile.activationStatus = "ACTIVE";
    inAll.profile.pin = pin;
    return HttpResponse.json({
      user_id: inAll.userId,
      success: true,
      message: "User profile activated and PIN set successfully",
      updatedFields: { activation_status: "active" },
    });
  }),
  http.post(API_UPDATE_USER_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      phone?: unknown;
      userId?: unknown;
      profile?: unknown;
    };
    const phone = typeof body.phone === "string" ? body.phone : "";
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!phone && !userId) {
      return HttpResponse.json(
        { message: "Missing required identifier: phone or userId" },
        { status: 400 },
      );
    }
    const patch =
      body.profile && typeof body.profile === "object"
        ? (body.profile as Record<string, unknown>)
        : {};
    const key = normalisePhone(phone);
    const targets = allRidersSeeds.filter(
      (s) => (userId && s.userId === userId) || (key && normalisePhone(s.profile.phone) === key),
    );
    for (const target of targets) {
      applyPatch(target.profile, patch);
    }
    if (key) patchStaffUser(key, patch);
    return HttpResponse.json({
      message: "User profile patched successfully",
      updatedFields: { profile: patch },
    });
  }),
];
