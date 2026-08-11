import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import NotFoundPage from "@/features/errors/NotFoundPage";
import ErrorBoundaryPage from "@/features/errors/ErrorBoundaryPage";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { saveSession } from "@/features/auth/session";

function Boom(): never {
  throw new Error("boom");
}

describe("NotFoundPage", () => {
  it("renders 404 title, message, and dashboard link on unknown route", async () => {
    window.localStorage.clear();
    const router = createMemoryRouter(
      [
        {
          element: (
            <AuthProvider>
              <NotFoundPage />
            </AuthProvider>
          ),
          path: "*",
        },
      ],
      { initialEntries: ["/does-not-exist"] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText("Page not found")).toBeInTheDocument();
    expect(screen.getByText(/does not exist or has moved/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /go to dashboard/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("Customer-seed profile still resolves to /login (F1 unknown-role safety)", async () => {
    saveSession({ role: "Customer" });
    const router = createMemoryRouter(
      [
        {
          element: (
            <AuthProvider>
              <NotFoundPage />
            </AuthProvider>
          ),
          path: "*",
        },
      ],
      { initialEntries: ["/does-not-exist"] },
    );
    render(<RouterProvider router={router} />);
    const link = await screen.findByRole("link", { name: /go to dashboard/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});

describe("ErrorBoundaryPage", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
  });

  it("renders friendly error UI when a child route throws", async () => {
    const router = createMemoryRouter(
      [
        {
          errorElement: <ErrorBoundaryPage />,
          children: [{ path: "/", element: <Boom /> }],
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute("href", "/");
    expect(errSpy).toHaveBeenCalled();
  });
});