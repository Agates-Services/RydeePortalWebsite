import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Navigate, RouterProvider, createMemoryRouter, Outlet } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { saveSession } from "@/features/auth/session";
import { API_GET_ALL_USERS_URL } from "@/api/users";
import { UsersRoute } from "@/features/users/routes";
import { server } from "../setup";

const adminSeed = [
  { role: "Admin", profile: { id: 1, name: "Ayesha Admin", phone: "0300-1", email: "a@x", dateOfJoining: "2026-01-01" } },
  { role: "Admin", profile: { id: 2, name: "Hamza Admin", phone: "0300-2", email: "h@x", dateOfJoining: "2026-02-01" } },
];
const operatorSeed = [
  { role: "Operator", profile: { id: 3, name: "Sana Op", phone: "0300-3", email: "s@x", dateOfJoining: "2026-03-01" } },
  { role: "Operator", profile: { id: 4, name: "Bilal Op", phone: "0300-4", email: "b@x", dateOfJoining: "2026-04-01" } },
];

function mockUsers(users: unknown[]) {
  server.use(http.post(API_GET_ALL_USERS_URL, () => HttpResponse.json({ users })));
}

function renderRoute({ role = "Admin" }: { role?: string } = {}) {
  saveSession({ role });
  const router = createMemoryRouter(
    [
      {
        element: (
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        ),
        children: [
          {
            element: <ProtectedRoute allow={["Admin", "Operator"]} />,
            children: [{ path: "admin/users", element: <UsersRoute /> }],
          },
          { path: "login", element: <div data-testid="login-page">login</div> },
          { path: "*", element: <Navigate to="/login" replace /> },
        ],
      },
    ],
    { initialEntries: ["/admin/users"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("UsersPage — rendering", () => {
  it("renders both Admin and Operator rows when Admin", async () => {
    mockUsers([...adminSeed, ...operatorSeed]);
    renderRoute({ role: "Admin" });
    expect(await screen.findByText("Ayesha Admin")).toBeInTheDocument();
    expect(screen.getByText("Sana Op")).toBeInTheDocument();
    expect(screen.getByTestId("fqa-users-count-all")).toHaveTextContent("4");
    expect(screen.getByTestId("fqa-users-count-Admin")).toHaveTextContent("2");
    expect(screen.getByTestId("fqa-users-count-Operator")).toHaveTextContent("2");
  });

  it("filters by role tab", async () => {
    mockUsers([...adminSeed, ...operatorSeed]);
    const user = userEvent.setup();
    renderRoute({ role: "Admin" });
    await screen.findByText("Ayesha Admin");
    await user.click(screen.getByRole("tab", { name: /operator/i }));
    await waitFor(() => expect(screen.queryByText("Ayesha Admin")).not.toBeInTheDocument());
    expect(screen.getByText("Sana Op")).toBeInTheDocument();
  });

  it("search filters across name / phone / email", async () => {
    mockUsers([...adminSeed, ...operatorSeed]);
    const user = userEvent.setup();
    renderRoute({ role: "Admin" });
    await screen.findByText("Ayesha Admin");
    const search = screen.getByLabelText(/search users/i);
    await user.type(search, "hamza");
    await waitFor(() => expect(screen.queryByText("Ayesha Admin")).not.toBeInTheDocument());
    expect(screen.getByText("Hamza Admin")).toBeInTheDocument();
  });

  it("renders error state on server 500", async () => {
    server.use(http.post(API_GET_ALL_USERS_URL, () => HttpResponse.text("boom", { status: 500 })));
    renderRoute({ role: "Admin" });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("boom");
  });

  it("row has edit-user testid for keyboard/mouse edit affordance", async () => {
    mockUsers(adminSeed);
    renderRoute({ role: "Admin" });
    await screen.findByText("Ayesha Admin");
    expect(screen.getByTestId("fqa-edit-user-1")).toBeInTheDocument();
    const row = screen.getByText("Ayesha Admin").closest("tr")!;
    expect(within(row).getByText("Admin")).toBeInTheDocument();
  });
});
