import { http, HttpResponse } from "msw";
import { API_CHANGE_PASSWORD_URL } from "@/api/account";
import { authSeed } from "./auth";

interface ChangePasswordBody {
  phone?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
}

export const accountHandlers = [
  http.post(API_CHANGE_PASSWORD_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as ChangePasswordBody;
    const phone = typeof body.phone === "string" ? body.phone : "";
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (!phone || !currentPassword || !newPassword) {
      return HttpResponse.json(
        { success: false, error: "phone, currentPassword, newPassword are required" },
        { status: 400 },
      );
    }
    if (newPassword.length < 8) {
      return HttpResponse.json(
        { success: false, error: "New password must be at least 8 characters" },
        { status: 400 },
      );
    }
    const user = authSeed.find((u) => u.phone === phone);
    if (!user) {
      return HttpResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    if (user.password !== currentPassword) {
      return HttpResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 },
      );
    }
    user.password = newPassword;
    return HttpResponse.json({ success: true });
  }),
];
