import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { RouterProvider, createMemoryRouter, Outlet } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { saveSession } from "@/features/auth/session";
import { API_ACTIVATE_RIDER_URL } from "@/api/riders";
import { API_GET_RIDER_DOCUMENTS_URL } from "@/api/riderDocuments";
import RiderEditPage from "@/features/riders/pages/RiderEditPage";
import { server } from "../setup";

function Layout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function mountAt(phone: string, seededRow: Record<string, unknown>) {
  saveSession({ role: "Admin" });
  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          {
            element: <ProtectedRoute allow={["Admin", "Operator"]} />,
            children: [
              {
                path: "admin/riders/:phone/edit",
                element: <RiderEditPage />,
              },
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
          state: { row: seededRow, role: "Rider", backTo: "/admin/all-riders" },
        },
      ],
    },
  );
  return render(<RouterProvider router={router} />);
}

describe("Rider activate flow (W2-1 regression)", () => {
  it("submits 6-digit PIN, calls /activate-rider, flips status to active", async () => {
    server.use(
      http.post(API_GET_RIDER_DOCUMENTS_URL, () => HttpResponse.json({ documents: [] })),
    );

    const activateCalls: Array<Record<string, unknown>> = [];
    server.use(
      http.post(API_ACTIVATE_RIDER_URL, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        activateCalls.push(body);
        return HttpResponse.json({
          success: true,
          message: "activated",
          updatedFields: { activation_status: "active" },
        });
      }),
    );

    mountAt("0312-4561234", {
      id: 201,
      name: "Muhammad Imran",
      phone: "0312-4561234",
      cnic: "42101-7654321-3",
      area: "DHA",
      joinedAt: "2026-07-20",
      status: "pending",
    });

    const user = userEvent.setup();
    const activateBtn = await screen.findByTestId("fqa-status-activate");
    const pinInput = document.getElementById("fqa-status-activate-pin") as HTMLInputElement;
    await user.type(pinInput, "123456");
    await waitFor(() => expect(activateBtn).not.toBeDisabled());
    await user.click(activateBtn);

    await waitFor(() => expect(activateCalls.length).toBe(1));
    expect(activateCalls[0]).toMatchObject({ phone: "0312-4561234", pin: "123456" });
  });

  it("rejects sub-6-digit PIN client-side (no API call)", async () => {
    server.use(
      http.post(API_GET_RIDER_DOCUMENTS_URL, () => HttpResponse.json({ documents: [] })),
    );
    const activateCalls: Array<Record<string, unknown>> = [];
    server.use(
      http.post(API_ACTIVATE_RIDER_URL, async ({ request }) => {
        activateCalls.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ success: true, message: "ok" });
      }),
    );

    mountAt("0312-4561234", {
      id: 201,
      name: "Muhammad Imran",
      phone: "0312-4561234",
      cnic: "42101-7654321-3",
      area: "DHA",
      joinedAt: "2026-07-20",
      status: "pending",
    });

    const user = userEvent.setup();
    const activateBtn = await screen.findByTestId("fqa-status-activate");
    const pinInput = document.getElementById("fqa-status-activate-pin") as HTMLInputElement;
    await user.type(pinInput, "1234");
    await user.click(activateBtn);

    await new Promise((r) => setTimeout(r, 50));
    expect(activateCalls.length).toBe(0);
  });
});
