import { http, HttpResponse } from "msw";
import { API_GET_ALL_USERS_URL } from "@/api/users";

interface UserProfile {
  id: number;
  name: string;
  phone: string;
  email?: string;
  area?: string;
  address?: string;
  dateOfJoining?: string;
}

interface UserEnvelope {
  role: "Admin" | "Operator";
  profile: UserProfile;
}

const adminSeeds: UserProfile[] = [
  {
    id: 1001,
    name: "Ayesha Siddiqui",
    phone: "0300-1111000",
    email: "ayesha.admin@rydee.pk",
    area: "Head Office",
    address: "Rydee HQ, Karachi",
    dateOfJoining: "2026-01-15",
  },
  {
    id: 1002,
    name: "Hamza Raza",
    phone: "0300-1111001",
    email: "hamza.admin@rydee.pk",
    area: "Head Office",
    dateOfJoining: "2026-02-01",
  },
];

const operatorSeeds: UserProfile[] = [
  {
    id: 2001,
    name: "Sana Tariq",
    phone: "0300-2222000",
    email: "sana.op@rydee.pk",
    area: "DHA Hub",
    dateOfJoining: "2026-03-10",
  },
  {
    id: 2002,
    name: "Bilal Nawaz",
    phone: "0300-2222001",
    email: "bilal.op@rydee.pk",
    area: "Clifton Hub",
    dateOfJoining: "2026-03-22",
  },
  {
    id: 2003,
    name: "Kiran Fatima",
    phone: "0300-2222002",
    area: "Gulshan-e-Iqbal Hub",
    dateOfJoining: "2026-04-05",
  },
];

function toEnvelope(role: "Admin" | "Operator", profile: UserProfile): UserEnvelope {
  return { role, profile };
}

export const usersHandlers = [
  http.post(API_GET_ALL_USERS_URL, async ({ request }) => {
    // Mock-only convenience: real backend MUST derive caller role from the session
    // cookie, never from the request body. See ADR-0003 /get-all-users row.
    const body = (await request.json().catch(() => ({}))) as { role?: unknown };
    const callerRole = typeof body.role === "string" ? body.role : "";
    const users: UserEnvelope[] = [];
    if (callerRole === "Admin") {
      for (const a of adminSeeds) users.push(toEnvelope("Admin", a));
      for (const o of operatorSeeds) users.push(toEnvelope("Operator", o));
    } else if (callerRole === "Operator") {
      for (const o of operatorSeeds) users.push(toEnvelope("Operator", o));
    }
    return HttpResponse.json({ users });
  }),
];
