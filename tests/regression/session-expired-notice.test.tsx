import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import LoginPage from "@/features/auth/pages/LoginPage";
import { AuthProvider } from "@/features/auth/AuthProvider";
import {
  SESSION_MAX_AGE_MS,
  SESSION_STORAGE_KEY,
  loadSession,
} from "@/features/auth/session";

function renderLogin(initialPath = "/login") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("session expiry notice", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("loadSession sets rydee.expired flag when envelope exceeds TTL", () => {
    const staleAt = Date.now() - SESSION_MAX_AGE_MS - 1000;
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 1, profile: { role: "Admin", name: "X" }, savedAt: staleAt }),
    );
    expect(loadSession()).toBeNull();
    expect(window.sessionStorage.getItem("rydee.expired")).toBe("1");
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("LoginPage renders the amber notice when ?reason=expired is present", async () => {
    renderLogin("/login?reason=expired");
    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
  });

  it("LoginPage renders the notice when sessionStorage flag is set, then clears the flag", async () => {
    window.sessionStorage.setItem("rydee.expired", "1");
    renderLogin("/login");
    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(window.sessionStorage.getItem("rydee.expired")).toBeNull();
    });
  });
});
