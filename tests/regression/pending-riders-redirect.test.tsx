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

describe("pending-riders legacy route redirect", () => {
  it("Admin hitting /admin/pending-riders lands on /admin/all-riders?status=pending", async () => {
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
                  path: "admin/pending-riders",
                  element: <Navigate to="/admin/all-riders?status=pending" replace />,
                },
                { path: "admin/all-riders", element: <AllRidersStub /> },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/admin/pending-riders"] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByTestId("all-riders")).toHaveTextContent("status=pending");
    expect(router.state.location.pathname).toBe("/admin/all-riders");
    expect(router.state.location.search).toBe("?status=pending");
  });
});
