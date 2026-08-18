import { http, HttpResponse } from "msw";
import {
  API_ACTIVATE_RIDER_URL,
  API_GET_ALL_RIDERS_URL,
  API_RESET_RIDER_PIN_URL,
  API_UPDATE_USER_URL,
} from "@/api/riders";

interface RiderProfile {
  name: string;
  phone: string;
  area?: string;
  address?: string;
  rideState?: string;
  dateOfJoining?: string;
  dob?: string;
  activationStatus?: "pending" | "active" | "blocked" | "offboarded";
  activation_status?: "pending" | "active" | "blocked" | "offboarded";
  totalRides?: number;
  totalDistance?: number;
  missedRides?: number;
  online?: boolean;
  currentLocation?: { lat: number; lon: number };
  rating?: number;
  lastCustomerID?: string;
  cnic?: string;
  documents?: string[];
  pin?: string;
  joinedAt?: string;
  id?: number;
  rideArea?: string;
  activated?: boolean;
}

interface RiderEnvelope {
  role: "rider";
  profile: RiderProfile;
}

function envelope(profile: RiderProfile): RiderEnvelope {
  return { role: "rider", profile };
}

// Seeds mix wire-field aliases so the mapper is exercised end-to-end.
const allRidersSeeds: RiderProfile[] = [
  {
    id: 201,
    name: "Muhammad Imran",
    phone: "0312-4561234",
    cnic: "42101-7654321-3",
    activationStatus: "pending",
    area: "DHA",
    joinedAt: "2026-07-20",
  },
  {
    id: 202,
    name: "Alia Rehman",
    phone: "0321-1234500",
    cnic: "42101-1111111-1",
    activationStatus: "active",
    rideArea: "Clifton",
    joinedAt: "2026-07-15",
    currentLocation: { lat: 24.8157, lon: 67.0235 },
  },
  {
    id: 203,
    name: "Naveed Akhtar",
    phone: "0321-9876543",
    cnic: "42201-1234567-1",
    activationStatus: "pending",
    area: "Gulshan-e-Iqbal",
    joinedAt: "2026-07-18",
  },
  {
    id: 204,
    name: "Faisal Khan",
    phone: "0300-9990001",
    cnic: "42301-2222222-2",
    activated: true,
    area: "Saddar",
    joinedAt: "2026-07-10",
  },
  {
    id: 205,
    name: "Shoaib Malik",
    phone: "0333-1122334",
    cnic: "42301-9988776-5",
    activationStatus: "pending",
    area: "Nazimabad",
    joinedAt: "2026-07-22",
  },
  {
    id: 206,
    name: "Rizwan Ghafoor",
    phone: "0345-5544332",
    cnic: "42101-4433221-7",
    activationStatus: "blocked",
    area: "Malir",
    joinedAt: "2026-06-30",
  },
  {
    id: 207,
    name: "Danish Mehmood",
    phone: "0300-7654321",
    cnic: "42401-6677889-2",
    activationStatus: "active",
    area: "North Karachi",
    joinedAt: "2026-07-05",
    currentLocation: { lat: 24.87, lon: 67.05 },
  },
  {
    id: 208,
    name: "Kashif Noor",
    phone: "0311-2233445",
    cnic: "42501-1122334-9",
    activationStatus: "offboarded",
    area: "Korangi",
    joinedAt: "2026-05-12",
  },
  {
    id: 209,
    name: "Sajid Iqbal",
    phone: "0322-8877665",
    cnic: "42601-5566778-4",
    activationStatus: "active",
    area: "Landhi",
    joinedAt: "2026-07-01",
    currentLocation: { lat: 24.82, lon: 67.13 },
  },
  {
    id: 210,
    name: "Adnan Rasheed",
    phone: "0343-3344556",
    cnic: "42101-2233445-6",
    activationStatus: "pending",
    area: "Orangi",
    joinedAt: "2026-07-25",
  },
  {
    id: 211,
    name: "Usman Tariq",
    phone: "0300-1111111",
    cnic: "42101-3344556-8",
    activationStatus: "active",
    area: "Saddar",
    joinedAt: "2026-06-15",
    currentLocation: { lat: 24.8607, lon: 67.0011 },
  },
  {
    id: 212,
    name: "Bilal Hussain",
    phone: "0300-2222222",
    cnic: "42101-4455667-9",
    activationStatus: "blocked",
    area: "Clifton",
    joinedAt: "2026-06-20",
  },
  {
    id: 213,
    name: "Zain ul Abidin",
    phone: "0300-3333333",
    cnic: "42101-5566778-1",
    activationStatus: "active",
    area: "Gulshan-e-Iqbal",
    joinedAt: "2026-07-08",
    currentLocation: { lat: 24.9215, lon: 67.0897 },
  },
  {
    id: 214,
    name: "Hamza Sheikh",
    phone: "0333-4455667",
    cnic: "42101-6677889-3",
    activationStatus: "offboarded",
    area: "DHA",
    joinedAt: "2026-05-01",
  },
  {
    id: 215,
    name: "Junaid Ali",
    phone: "0345-7788990",
    cnic: "42101-7788990-4",
    activationStatus: "active",
    area: "Nazimabad",
    joinedAt: "2026-07-12",
    currentLocation: { lat: 24.95, lon: 67.02 },
  },
  {
    id: 216,
    name: "Tariq Mahmood",
    phone: "0311-8899001",
    cnic: "42101-8899001-5",
    activationStatus: "pending",
    area: "PECHS",
    joinedAt: "2026-07-28",
  },
  {
    id: 217,
    name: "Yasir Iqbal",
    phone: "0322-9900112",
    cnic: "42101-9900112-6",
    activationStatus: "active",
    area: "Gulistan-e-Johar",
    joinedAt: "2026-06-25",
    currentLocation: { lat: 24.89, lon: 67.2 },
  },
  {
    id: 218,
    name: "Salman Farooq",
    phone: "0343-0011223",
    cnic: "42101-0011223-7",
    activationStatus: "blocked",
    area: "Malir",
    joinedAt: "2026-06-05",
  },
];

interface ActivateBody {
  phone?: string;
  pin?: string;
}

function normalisePhone(v: string): string {
  return v.replace(/\D/g, "");
}

const pinResetAt = new Map<string, string>();

function generatePin(): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

export const ridersHandlers = [
  http.post(API_GET_ALL_RIDERS_URL, async () => {
    return HttpResponse.json({ riders: allRidersSeeds.map(envelope) });
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
    const inAll = allRidersSeeds.find((s) => normalisePhone(s.phone) === phone);
    if (!inAll) {
      return HttpResponse.json(
        { success: false, error: "User profile does not exist!" },
        { status: 404 },
      );
    }
    inAll.activationStatus = "active";
    inAll.pin = pin;
    return HttpResponse.json({
      success: true,
      message: "User profile activated and PIN set successfully",
      updatedFields: { activation_status: "active" },
    });
  }),
  http.post(API_UPDATE_USER_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const phone = typeof body.phone === "string" ? body.phone : "";
    const role = typeof body.role === "string" ? body.role : "";
    if (!phone || !role) {
      return HttpResponse.json(
        { message: "Missing required identifier fields: phone, role" },
        { status: 400 },
      );
    }
    const key = normalisePhone(phone);
    const patch = { ...body };
    delete patch.phone;
    delete patch.role;
    const targets = allRidersSeeds.filter((s) => normalisePhone(s.phone) === key);
    for (const target of targets) {
      Object.assign(target, patch);
    }
    return HttpResponse.json({
      message: "User profile patched successfully",
      updatedFields: patch,
    });
  }),
  http.post(API_RESET_RIDER_PIN_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { phone?: unknown; role?: unknown };
    const phone = typeof body.phone === "string" ? body.phone : "";
    const role = typeof body.role === "string" ? body.role : "";
    if (!phone || !role) {
      return HttpResponse.json({ success: false, error: "phone and role are required" }, { status: 400 });
    }
    const key = normalisePhone(phone);
    const inAll = allRidersSeeds.find((s) => normalisePhone(s.phone) === key);
    if (!inAll) {
      return HttpResponse.json({ success: false, error: "Rider not found" }, { status: 404 });
    }
    const pin = generatePin();
    inAll.pin = pin;
    const lastResetAt = new Date().toISOString();
    pinResetAt.set(key, lastResetAt);
    return HttpResponse.json({ success: true, pin, lastResetAt });
  }),
];
