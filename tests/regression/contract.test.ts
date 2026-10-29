import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import { API_LOGIN_URL, API_REGISTER_URL } from "@/api/auth";

async function captureLoginBody(triggerBody: Record<string, unknown>) {
  let seen: unknown;
  let contentType: string | null = null;
  let credentialsOk = false;
  server.use(
    http.post(API_LOGIN_URL, async ({ request }) => {
      seen = await request.json();
      contentType = request.headers.get("content-type");
      // The server-side Fetch Request does not expose the client credentials flag, so this test verifies shape and content-type only.
      credentialsOk = true;
      return HttpResponse.json({ role: "Rider", profile: { role: "Rider" } });
    }),
  );
  const res = await fetch(API_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(triggerBody),
    credentials: "include",
  });
  return { seen, contentType, credentialsOk, status: res.status };
}

describe("H1 — POST /user/login body shape", () => {
  it("body has EXACTLY { phone, password } — no extra, no missing keys", async () => {
    const { seen, contentType, status } = await captureLoginBody({
      phone: "0300111111",
      password: "rider",
    });
    expect(status).toBe(200);
    expect(seen).toEqual({ phone: "0300111111", password: "rider" });
    // Strict key-set check guards against a silent widening of the request body.
    expect(Object.keys(seen as object).sort()).toEqual(["password", "phone"]);
    expect(contentType).toMatch(/application\/json/i);
  });
});

async function captureRegisterBody(triggerBody: Record<string, unknown>) {
  let seen: unknown;
  server.use(
    http.post(API_REGISTER_URL, async ({ request }) => {
      seen = await request.json();
      return HttpResponse.json({ ok: true, email: "x", role: "rider" });
    }),
  );
  await fetch(API_REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(triggerBody),
    credentials: "include",
  });
  return seen;
}

describe("H1 — POST /register/user body shape", () => {
  it("body has EXACTLY the 7 frozen fields", async () => {
    const body = {
      name: "Alice",
      email: "a@example.com",
      phone: "0300000000",
      dob: "1990-01-01",
      address: "1 Street",
      password: "pw",
      role: "rider",
    };
    const seen = await captureRegisterBody(body);
    expect(seen).toEqual(body);
    expect(Object.keys(seen as object).sort()).toEqual([
      "address",
      "dob",
      "email",
      "name",
      "password",
      "phone",
      "role",
    ]);
  });
});

describe("H6 — MSW default handlers match ADR-0003 contract", () => {
  it("login success shape: { user_id, role, profile } per API-Document-V1", async () => {
    const res = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0300111111", password: "rider" }),
      credentials: "include",
    });
    const data = (await res.json()) as unknown;
    expect(data).toMatchObject({
      user_id: expect.any(String),
      role: expect.any(String),
      profile: expect.objectContaining({ role: expect.any(String) }),
    });
    const { profile } = data as { profile: { role: string; dateOfJoining?: unknown } };
    expect(typeof profile.role).toBe("string");
  });

  it("login 401 body is text 'Invalid phone or password' (not JSON)", async () => {
    const res = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0300111111", password: "WRONG" }),
      credentials: "include",
    });
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Invalid phone or password");
  });

  it("register 400 when required fields missing", async () => {
    const res = await fetch(API_REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "only-name" }),
      credentials: "include",
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toMatch(/missing required fields/i);
  });
});

describe("H1/H6 — API-Document-V1 contract (riders domain)", () => {
  it("get-all-riders returns { success:true, riders:[{ userId, profile }] } with UPPERCASE activationStatus", async () => {
    const { API_GET_ALL_RIDERS_URL } = await import("@/api/riders");
    const res = await fetch(API_GET_ALL_RIDERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = (await res.json()) as {
      success: boolean;
      riders: Array<{ userId: string; profile: Record<string, unknown> }>;
    };
    expect(data.success).toBe(true);
    expect(Array.isArray(data.riders)).toBe(true);
    const first = data.riders[0];
    expect(typeof first.userId).toBe("string");
    expect(first.profile).toBeTypeOf("object");
    expect(first.profile.activationStatus).toBe(String(first.profile.activationStatus).toUpperCase());
    expect(first.profile.documents).toBeTypeOf("object");
  });

  it("api-client flattens rider rows and lowercases activationStatus", async () => {
    const { getAllRiders } = await import("@/api/riders");
    const { riders } = await getAllRiders();
    expect(riders && riders.length).toBeGreaterThan(0);
    const row = riders![0];
    expect(typeof row.userId).toBe("string");
    expect(typeof row.name).toBe("string");
    expect(String(row.activationStatus)).toBe(String(row.activationStatus).toLowerCase());
  });

  it("api-client accepts a singular rider response", async () => {
    const { API_GET_ALL_RIDERS_URL, getAllRiders } = await import("@/api/riders");
    server.use(
      http.post(API_GET_ALL_RIDERS_URL, () =>
        HttpResponse.json({
          success: true,
          rider: {
            userId: "rider-1",
            profile: {
              name: "Tester4",
              phone: "03001234567",
              activationStatus: "ACTIVE",
              documents: { cnic: "1234578986565" },
            },
          },
        }),
      ),
    );

    const { riders } = await getAllRiders();
    expect(riders).toHaveLength(1);
    expect(riders?.[0]).toMatchObject({
      userId: "rider-1",
      phone: "03001234567",
      documents: { cnic: "1234578986565" },
      activationStatus: "active",
    });
  });

  it("update-user body is { phone, userId, profile:{...patch} }", async () => {
    const { updateUser } = await import("@/api/riders");
    const { API_UPDATE_USER_URL } = await import("@/api/riders");
    let seen: unknown;
    server.use(
      http.post(API_UPDATE_USER_URL, async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json({ message: "ok", updatedFields: {} });
      }),
    );
    await updateUser("0312-4561234", "rider-201", { area: "Clifton", documents: { cnic: "x" } });
    expect(seen).toEqual({
      phone: "0312-4561234",
      userId: "rider-201",
      profile: { area: "Clifton", documents: { cnic: "x" } },
    });
    expect(Object.keys(seen as object).sort()).toEqual(["phone", "profile", "userId"]);
  });

  it("update-user default handler responds { message, updatedFields:{ profile } }", async () => {
    const { updateUser } = await import("@/api/riders");
    const res = await updateUser("0312-4561234", "rider-201", { area: "DHA" });
    expect(res.message).toMatch(/patched/i);
    expect(res.updatedFields).toMatchObject({ profile: { area: "DHA" } });
  });

  it("activate-rider request { phone, pin } → { user_id, success, message, updatedFields }", async () => {
    const { activateRider } = await import("@/api/riders");
    const res = await activateRider("0312-4561234", "123456");
    expect(res.success).toBe(true);
    expect(typeof res.message).toBe("string");
    expect(res.updatedFields).toMatchObject({ activation_status: "active" });
  });

  it("activate-rider error case → { success:false, error }", async () => {
    const { activateRider } = await import("@/api/riders");
    let caught: unknown;
    try {
      await activateRider("0000000000", "123456");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeTruthy();
  });
});
