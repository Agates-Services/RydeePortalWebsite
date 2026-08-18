import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navigate, Outlet, RouterProvider, createMemoryRouter, useLocation } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { saveSession } from "@/features/auth/session";

function AllRidersStub() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return <div data-testid="all-riders">status={params.get("status") ?? ""}</div>;
}

function Layout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

describe("blocked-riders legacy route redirect", () => {
  it("Admin hitting /admin/blocked-riders lands on /admin/all-riders?status=blocked", async () => {
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
                  path: "admin/blocked-riders",
                  element: <Navigate to="/admin/all-riders?status=blocked" replace />,
                },
                { path: "admin/all-riders", element: <AllRidersStub /> },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/admin/blocked-riders"] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByTestId("all-riders")).toHaveTextContent("status=blocked");
    expect(router.state.location.pathname).toBe("/admin/all-riders");
    expect(router.state.location.search).toBe("?status=blocked");
  });
});