import { describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router";
import ProfilePage from "@/features/account/pages/ProfilePage";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { SESSION_STORAGE_KEY } from "@/features/auth/session";
import { API_UPDATE_USER_URL } from "@/api/riders";
import { server } from "../setup";

function seedAdmin() {
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      v: 2,
      userId: "USER#0300222222",
      profile: { role: "Admin", name: "Admin One", phone: "0300222222", address: "Old address" },
      savedAt: Date.now(),
    }),
  );
}

function seedRider() {
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      v: 2,
      userId: "USER#0300111111",
      profile: {
        role: "Rider",
        name: "Rider One",
        phone: "0300111111",
        address: "R Addr",
        activationStatus: "active",
      },
      savedAt: Date.now(),
    }),
  );
}

function renderProfile() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/account/profile"]}>
        <Routes>
          <Route path="/account/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("ProfilePage — profile tab", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("renders name, phone, role, address for Admin (no activation pill)", async () => {
    seedAdmin();
    renderProfile();
    expect(await screen.findByDisplayValue("Admin One")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0300222222")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Admin")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Old address")).toBeInTheDocument();
    expect(screen.queryByTestId("fqa-account-activation")).toBeNull();
  });

  it("shows the activation pill for Rider role", async () => {
    seedRider();
    renderProfile();
    expect(await screen.findByTestId("fqa-account-activation")).toBeInTheDocument();
  });

  it("sends the full profile on save (replacement-safe), role lowercased, phone excluded", async () => {
    seedAdmin();
    let receivedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(API_UPDATE_USER_URL, async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: "ok" });
      }),
    );
    renderProfile();
    const user = userEvent.setup();
    const nameInput = await screen.findByDisplayValue("Admin One");
    await user.clear(nameInput);
    await user.type(nameInput, "Admin Renamed");
    await user.click(screen.getByTestId("fqa-account-save"));
    await waitFor(() => {
      expect(receivedBody).not.toBeNull();
    });
    expect(receivedBody).toMatchObject({
      phone: "0300222222",
      userId: "USER#0300222222",
      profile: { name: "Admin Renamed", address: "Old address", role: "admin" },
    });
    const profile = (receivedBody as { profile: Record<string, unknown> }).profile;
    expect(Object.keys(profile)).not.toContain("phone");
    expect(profile.role).toBe("admin");
  });

  it("opens the discard-confirm dialog when Cancel is clicked with edits", async () => {
    seedAdmin();
    renderProfile();
    const user = userEvent.setup();
    const nameInput = await screen.findByDisplayValue("Admin One");
    await user.type(nameInput, " edited");
    const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
    await user.click(cancelButtons[0]);
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  });
});
