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
    rideCount: 0,
    totalRides: 3,
    totalDistance: 12,
    missedRides: 1,
    rating: 5,
    online: false,
    currentLocation: null,
    lastCustomerID: null,
    activationStatus: "PENDING",
    documents: { cnic: "4210112345671", license: null, vehicleRegistration: null, profilePicture: null, utilityBill: null },
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

describe("Rider profile save (read + write path regression)", () => {
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
    expect(screen.getByDisplayValue("42101-1234567-1")).toBeInTheDocument();
  });

  it("loads CNIC from a singular rider response when phone is null", async () => {
    let seen: { phone?: string; userId?: string; profile?: Record<string, unknown> } | null = null;
    server.use(
      http.post(API_GET_ALL_RIDERS_URL, () =>
        HttpResponse.json({
          success: true,
          rider: {
            userId: "d90e7359-52f5-4ecc-8173-9893327b29ee",
            profile: {
              name: "Tester4",
              phone: null,
              role: "rider",
              area: "DHA Phase 1",
              address: null,
              dob: "2008-01-08",
              activationStatus: "ACTIVE",
              documents: {
                cnic: "1234578986565",
                license: null,
                vehicleRegistration: null,
                profilePicture: null,
                utilityBill: null,
              },
            },
          },
        }),
      ),
      http.post(API_GET_RIDER_DOCUMENTS_URL, () => HttpResponse.json({ documents: [] })),
      http.post(API_UPDATE_USER_URL, async ({ request }) => {
        seen = (await request.json()) as typeof seen;
        return HttpResponse.json({ message: "patched", updatedFields: {} });
      }),
    );
    mountFetch("03001234567");

    expect(await screen.findByDisplayValue("12345-7898656-5")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Address"), "Updated address");
    await user.click(screen.getByTestId("fqa-edit-save"));

    await waitFor(() => expect(seen).not.toBeNull());
    expect(seen).toEqual({
      phone: "03001234567",
      userId: "d90e7359-52f5-4ecc-8173-9893327b29ee",
      profile: { address: "Updated address" },
    });
  });

  it("sends only editable profile fields on save", async () => {
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
    expect(seen!.profile).toEqual({ address: "New Address 99" });
  });

  it("sends the nested CNIC only when the CNIC changes", async () => {
    withGetAllRiders();
    let seen: { profile?: Record<string, unknown> } | null = null;
    server.use(
      http.post(API_UPDATE_USER_URL, async ({ request }) => {
        seen = (await request.json()) as typeof seen;
        return HttpResponse.json({ message: "patched", updatedFields: {} });
      }),
    );
    mountFetch("3323720454");
    const user = userEvent.setup();
    const cnicInput = await screen.findByDisplayValue("42101-1234567-1");
    await user.clear(cnicInput);
    await user.type(cnicInput, "1234567890123");
    await user.click(screen.getByTestId("fqa-edit-save"));

    await waitFor(() => expect(seen).not.toBeNull());
    expect(seen!.profile).toEqual({ documents: { cnic: "1234567890123" } });
  });

  it("Block status change sends only activationStatus", async () => {
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
    expect(seen!.profile).toEqual({ activationStatus: "BLOCKED" });
  });
});
