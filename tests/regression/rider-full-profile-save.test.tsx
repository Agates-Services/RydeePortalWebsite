import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { RouterProvider, createMemoryRouter, Outlet } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { saveSession } from "@/features/auth/session";
import { API_GET_ALL_RIDERS_URL, API_UPDATE_USER_URL, getAllRiders } from "@/api/riders";
import { API_GET_RIDER_DOCUMENTS_URL } from "@/api/riderDocuments";
import RiderEditPage from "@/features/riders/pages/RiderEditPage";
import { server } from "../setup";

const WIRE_RIDER = {
  userId: "2f878136-39df-4c91-88af-2ddc5d06b0c4",
  profile: {
    name: "Ghulam Ali",
    phone: "3323720454",
    role: "rider",
    area: "Clifton",
    address: "House 5, Street 2",
    rideState: "IDLE",
    dateOfJoining: "2026-07-01",
    dob: "1995-04-12",
    cnic: "4210112345671",
    rideCount: 0,
    totalRides: 3,
    totalDistance: 12,
    missedRides: 1,
    rating: 5,
    online: false,
    currentLocation: null,
    lastCustomerID: null,
    activationStatus: "PENDING",
    documents: { cnic: null, license: null, vehicleRegistration: null, profilePicture: null, utilityBill: null },
  },
};

function withGetAllRiders() {
  server.use(
    http.post(API_GET_ALL_RIDERS_URL, () =>
      HttpResponse.json({ success: true, riders: [WIRE_RIDER] }),
    ),
    http.post(API_GET_RIDER_DOCUMENTS_URL, () => HttpResponse.json({ documents: [] })),
  );
}

function withActiveRider() {
  const active = { ...WIRE_RIDER, profile: { ...WIRE_RIDER.profile, activationStatus: "ACTIVE" } };
  server.use(
    http.post(API_GET_ALL_RIDERS_URL, () =>
      HttpResponse.json({ success: true, riders: [active] }),
    ),
    http.post(API_GET_RIDER_DOCUMENTS_URL, () => HttpResponse.json({ documents: [] })),
  );
}

function Layout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function mountFetch(phone: string) {
  saveSession({ role: "Admin" });
  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          {
            element: <ProtectedRoute allow={["Admin", "Operator"]} />,
            children: [
              { path: "admin/riders/:phone/edit", element: <RiderEditPage /> },
              { path: "admin/all-riders", element: <div data-testid="all-riders">list</div> },
            ],
          },
        ],
      },
    ],
    {
      initialEntries: [
        {
          pathname: `/admin/riders/${encodeURIComponent(phone)}/edit`,
          state: { role: "Rider", backTo: "/admin/all-riders" },
        },
      ],
    },
  );
  return render(<RouterProvider router={router} />);
}

describe("Rider full-profile save (read + write path regression)", () => {
  it("flattener carries address and preserves the raw wire profile", async () => {
    withGetAllRiders();
    const { riders } = await getAllRiders();
    const row = riders![0];
    expect(row.address).toBe("House 5, Street 2");
    expect(row.rawProfile).toMatchObject({
      role: "rider",
      activationStatus: "PENDING",
      address: "House 5, Street 2",
      rating: 5,
    });
  });

  it("populates the Address field from the backend response", async () => {
    withGetAllRiders();
    mountFetch("3323720454");
    expect(await screen.findByDisplayValue("House 5, Street 2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ghulam Ali")).toBeInTheDocument();
  });

  it("sends the FULL wire profile on save when only address changed", async () => {
    withGetAllRiders();
    let seen: { phone?: string; userId?: string; profile?: Record<string, unknown> } | null = null;
    server.use(
      http.post(API_UPDATE_USER_URL, async ({ request }) => {
        seen = (await request.json()) as typeof seen;
        return HttpResponse.json({ message: "patched", updatedFields: {} });
      }),
    );
    mountFetch("3323720454");
    const user = userEvent.setup();
    const addressInput = await screen.findByDisplayValue("House 5, Street 2");
    await user.clear(addressInput);
    await user.type(addressInput, "New Address 99");
    await user.click(screen.getByTestId("fqa-edit-save"));

    await waitFor(() => expect(seen).not.toBeNull());
    expect(seen!.userId).toBe("2f878136-39df-4c91-88af-2ddc5d06b0c4");
    const profile = seen!.profile!;
    expect(profile.address).toBe("New Address 99");
    expect(profile.role).toBe("rider");
    expect(profile.activationStatus).toBe("PENDING");
    expect(profile.rideState).toBe("IDLE");
    expect(profile.rating).toBe(5);
    expect(profile.totalRides).toBe(3);
    expect(profile.documents).toBeTypeOf("object");
    expect(profile.name).toBe("Ghulam Ali");
    expect(profile.dob).toBe("1995-04-12");
    expect(profile.cnic).toBeUndefined();
    expect(profile.documents).toMatchObject({
      cnic: "4210112345671",
      license: null,
      vehicleRegistration: null,
      profilePicture: null,
      utilityBill: null,
    });
  });

  it("nests an edited cnic under documents and preserves sibling document fields", async () => {
    const withLicense = {
      ...WIRE_RIDER,
      profile: {
        ...WIRE_RIDER.profile,
        documents: {
          cnic: null,
          license: "license-url",
          vehicleRegistration: "vr-url",
          profilePicture: null,
          utilityBill: null,
        },
      },
    };
    server.use(
      http.post(API_GET_ALL_RIDERS_URL, () =>
        HttpResponse.json({ success: true, riders: [withLicense] }),
      ),
      http.post(API_GET_RIDER_DOCUMENTS_URL, () => HttpResponse.json({ documents: [] })),
    );
    let seen: { profile?: Record<string, unknown> } | null = null;
    server.use(
      http.post(API_UPDATE_USER_URL, async ({ request }) => {
        seen = (await request.json()) as typeof seen;
        return HttpResponse.json({ message: "patched", updatedFields: {} });
      }),
    );
    mountFetch("3323720454");
    const user = userEvent.setup();
    const cnicInput = await screen.findByLabelText(/cnic/i);
    await user.clear(cnicInput);
    await user.type(cnicInput, "4210199999999");
    await user.click(screen.getByTestId("fqa-edit-save"));

    await waitFor(() => expect(seen).not.toBeNull());
    const profile = seen!.profile!;
    expect(profile.cnic).toBeUndefined();
    expect(profile.documents).toMatchObject({
      cnic: "4210199999999",
      license: "license-url",
      vehicleRegistration: "vr-url",
      profilePicture: null,
      utilityBill: null,
    });
  });

  it("Block status change sends the full wire profile with activationStatus=BLOCKED", async () => {
    withActiveRider();
    let seen: { profile?: Record<string, unknown> } | null = null;
    server.use(
      http.post(API_UPDATE_USER_URL, async ({ request }) => {
        seen = (await request.json()) as typeof seen;
        return HttpResponse.json({ message: "patched", updatedFields: {} });
      }),
    );
    mountFetch("3323720454");
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("fqa-status-block"));
    const dialog = await screen.findByRole("alertdialog");
    const confirm = within(dialog).getAllByRole("button");
    await user.click(confirm[confirm.length - 1]);

    await waitFor(() => expect(seen).not.toBeNull());
    const profile = seen!.profile!;
    expect(profile.activationStatus).toBe("BLOCKED");
    expect(profile.name).toBe("Ghulam Ali");
    expect(profile.rating).toBe(5);
    expect(profile.documents).toBeTypeOf("object");
    expect(profile.dateOfJoining).toBe("2026-07-01");
  });
});
