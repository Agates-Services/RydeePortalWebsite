import { describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import ProfilePage from "@/features/account/pages/ProfilePage";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { SESSION_STORAGE_KEY } from "@/features/auth/session";

function seedAdmin() {
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      v: 2,
      userId: "USER#0300222222",
      profile: { role: "Admin", name: "Admin One", phone: "0300222222", address: "A" },
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

async function switchToSettings() {
  const user = userEvent.setup();
  const settingsTab = await screen.findByRole("tab", { name: /settings/i });
  await user.click(settingsTab);
  return user;
}

describe("ProfilePage — change password", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("blocks submit and shows mismatch when new/confirm differ", async () => {
    seedAdmin();
    renderProfile();
    const user = await switchToSettings();
    await user.type(document.getElementById("fqa-account-currentpw")!, "admin");
    await user.type(document.getElementById("fqa-account-newpw")!, "newpassword1");
    await user.type(document.getElementById("fqa-account-confirmpw")!, "different1");
    await user.click(screen.getByTestId("fqa-account-changepw"));
    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
  });

  it("blocks submit when new password is shorter than 8 chars", async () => {
    seedAdmin();
    renderProfile();
    const user = await switchToSettings();
    await user.type(document.getElementById("fqa-account-currentpw")!, "admin");
    await user.type(document.getElementById("fqa-account-newpw")!, "short");
    await user.type(document.getElementById("fqa-account-confirmpw")!, "short");
    await user.click(screen.getByTestId("fqa-account-changepw"));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/at least 8 characters/i);
  });

  it("succeeds against the mock with correct current password (returns success)", async () => {
    seedAdmin();
    renderProfile();
    const user = await switchToSettings();
    await user.type(document.getElementById("fqa-account-currentpw")!, "admin");
    await user.type(document.getElementById("fqa-account-newpw")!, "newpassword1");
    await user.type(document.getElementById("fqa-account-confirmpw")!, "newpassword1");
    await user.click(screen.getByTestId("fqa-account-changepw"));
    expect(await screen.findByText(/password changed/i)).toBeInTheDocument();
  });

  it("returns a 400 (not 401) with wrong current password so the session is not hijacked", async () => {
    seedAdmin();
    renderProfile();
    const user = await switchToSettings();
    await user.type(document.getElementById("fqa-account-currentpw")!, "WRONG");
    await user.type(document.getElementById("fqa-account-newpw")!, "newpassword1");
    await user.type(document.getElementById("fqa-account-confirmpw")!, "newpassword1");
    await user.click(screen.getByTestId("fqa-account-changepw"));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/current password is incorrect/i);
    expect(alert.textContent ?? "").not.toMatch(/"success"\s*:\s*false/);
    expect(alert.textContent ?? "").not.toMatch(/^\s*\{/);
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
  });
});
