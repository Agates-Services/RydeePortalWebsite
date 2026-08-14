import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Navigate, Outlet, RouterProvider, createMemoryRouter, useLocation, useParams } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { saveSession } from "@/features/auth/session";
import { API_GET_ALL_USERS_URL } from "@/api/users";
import { UsersRoute } from "@/features/users/routes";
import { server } from "../setup";

function RiderRedirectToUserEdit() {
  const { phone } = useParams();
  const location = useLocation();
  return (
    <Navigate
      to={"/admin/users/" + encodeURIComponent(phone ?? "") + "/edit"}
      state={location.state}
      replace
    />
  );
}

function UserEditStub() {
  const { phone } = useParams();
  const { state } = useLocation();
  const s = state as { role?: string } | null;
  return (
    <div data-testid="user-edit">
      phone={phone} role={s?.role ?? "none"}
    </div>
  );
}

function Layout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

describe("Wave 5 — /admin/riders/:phone/edit redirects to /admin/users/:phone/edit", () => {
  it("preserves the phone param and forwards navigation state (role: Rider)", async () => {
    saveSession({ role: "Admin" });
    const router = createMemoryRouter(
      [
        {
          element: <Layout />,
          children: [
            {
              element: <ProtectedRoute allow={["Admin", "Operator"]} />,
              children: [
                { path: "admin/riders/:phone/edit", element: <RiderRedirectToUserEdit /> },
                { path: "admin/users/:phone/edit", element: <UserEditStub /> },
              ],
            },
          ],
        },
      ],
      {
        initialEntries: [
          { pathname: "/admin/riders/0300111222/edit", state: { role: "Rider" } },
        ],
      },
    );
    render(<RouterProvider router={router} />);
    const el = await screen.findByTestId("user-edit");
    expect(el).toHaveTextContent("phone=0300111222");
    expect(el).toHaveTextContent("role=Rider");
    expect(router.state.location.pathname).toBe("/admin/users/0300111222/edit");
  });
});

const adminSeed = [
  { role: "Admin", profile: { id: 1, name: "Ayesha Admin", phone: "0300-1", email: "a@x", dateOfJoining: "2026-01-01" } },
];

function renderUsersPage(role: string) {
  saveSession({ role });
  server.use(http.post(API_GET_ALL_USERS_URL, () => HttpResponse.json({ users: adminSeed })));
  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          {
            element: <ProtectedRoute allow={["Admin", "Operator"]} />,
            children: [
              { path: "admin/users", element: <UsersRoute /> },
              { path: "admin/users/new", element: <div data-testid="new-user-page">new</div> },
            ],
          },
        ],
      },
    ],
    { initialEntries: ["/admin/users"] },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

describe("Wave 5 — Users page Add new button", () => {
  it("is visible for Admin and navigates to /admin/users/new", async () => {
    const { router } = renderUsersPage("Admin");
    const btn = await screen.findByTestId("fqa-users-add-new");
    await userEvent.setup().click(btn);
    await waitFor(() => expect(router.state.location.pathname).toBe("/admin/users/new"));
  });

  it("is hidden for Operator", async () => {
    renderUsersPage("Operator");
    await screen.findByText("Ayesha Admin");
    expect(screen.queryByTestId("fqa-users-add-new")).not.toBeInTheDocument();
  });
});
