import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Outlet, RouterProvider, createMemoryRouter } from "react-router";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import { API_REGISTER_URL } from "@/api/auth";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { server } from "../setup";

vi.mock("@/components/DatePickerField", () => ({
  DatePickerField: ({
    id,
    onChange,
  }: {
    id: string;
    value: Date | undefined;
    onChange: (d: Date | undefined) => void;
  }) => (
    <input
      id={id}
      aria-label="Date of birth"
      onChange={(e) => {
        const v = e.target.value;
        onChange(v ? new Date(v) : undefined);
      }}
    />
  ),
}));

function isoDobFor25(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d.toISOString().slice(0, 10);
}

describe("Wave 5 — register role dropdown default (bug fix)", () => {
  it("initial value is empty and placeholder option is selected", () => {
    render(
      <MemoryRouter>
        <RegisterPage showRole backTo="/admin/users" />
      </MemoryRouter>,
    );
    const select = screen.getByLabelText(/role/i) as HTMLSelectElement;
    expect(select.value).toBe("");
    const placeholder = Array.from(select.options).find((o) => o.value === "");
    expect(placeholder).toBeDefined();
    expect(placeholder!.disabled).toBe(true);
  });

  it("submitting without picking a role surfaces a role validation error and does not POST", async () => {
    const user = userEvent.setup();
    let postSeen = false;
    server.use(
      http.post(API_REGISTER_URL, () => {
        postSeen = true;
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    render(
      <MemoryRouter>
        <RegisterPage showRole backTo="/admin/users" />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/^name$/i), "Test User");
    await user.type(screen.getByLabelText(/phone number/i), "0300123456");
    await user.type(screen.getByLabelText(/date of birth/i), isoDobFor25());
    await user.type(screen.getByLabelText(/home address/i), "DHA Karachi");
    await user.type(screen.getByLabelText(/^password$/i), "hunter2!");
    await user.type(screen.getByLabelText(/confirm password/i), "hunter2!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByText(/select a role/i);
    expect(postSeen).toBe(false);
    const select = screen.getByLabelText(/role/i) as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("submitting after picking Operator sends role='Operator' in the API body", async () => {
    const user = userEvent.setup();
    let bodyRole: unknown = null;
    server.use(
      http.post(API_REGISTER_URL, async ({ request }) => {
        const body = (await request.json()) as { role?: unknown };
        bodyRole = body.role;
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    function Layout() {
      return (
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      );
    }
    const router = createMemoryRouter(
      [
        {
          element: <Layout />,
          children: [
            { path: "admin/users/new", element: <RegisterPage showRole backTo="/admin/users" /> },
            { path: "admin/users", element: <div data-testid="users-page">users</div> },
            { path: "login", element: <div data-testid="login-page">login</div> },
          ],
        },
      ],
      { initialEntries: ["/admin/users/new"] },
    );
    render(<RouterProvider router={router} />);

    await user.type(screen.getByLabelText(/^name$/i), "Test User");
    await user.type(screen.getByLabelText(/phone number/i), "0300123456");
    await user.type(screen.getByLabelText(/date of birth/i), isoDobFor25());
    await user.type(screen.getByLabelText(/home address/i), "DHA Karachi");
    await user.type(screen.getByLabelText(/^password$/i), "hunter2!");
    await user.type(screen.getByLabelText(/confirm password/i), "hunter2!");
    await user.selectOptions(screen.getByLabelText(/role/i), "Operator");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(bodyRole).toBe("Operator"));
  });
});
