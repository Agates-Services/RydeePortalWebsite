import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { joinUrl, post, SESSION_EXPIRED_FLAG } from "@/api/client";
import { API_LOGIN_URL } from "@/api/auth";
import { SESSION_STORAGE_KEY } from "@/features/auth/session";

type FetchArgs = Parameters<typeof fetch>;

function installFetch(response: Response) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (..._args: FetchArgs) => response);
}

function seedSession() {
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ v: 1, profile: { role: "Admin", name: "Seed" }, savedAt: Date.now() }),
  );
}

describe("API client — global 401 handling", () => {
  const originalHref = window.location.href;
  let hrefSet: string | null = null;

  beforeEach(() => {
    vi.restoreAllMocks();
    hrefSet = null;
    window.localStorage.clear();
    window.sessionStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        pathname: "/admin",
        href: originalHref,
        set href(v: string) {
          hrefSet = v;
        },
        get href() {
          return originalHref;
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears session + sets expired flag + redirects to /login?reason=expired on non-login 401", async () => {
    seedSession();
    installFetch(new Response("", { status: 401 }));
    await expect(post(joinUrl("/some-endpoint"))).rejects.toThrow();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_EXPIRED_FLAG)).toBe("1");
    expect(hrefSet).toBe("/login?reason=expired");
  });

  it("does NOT hijack 401 from /user-login (bad-credentials path)", async () => {
    seedSession();
    installFetch(new Response("Invalid phone or password", { status: 401 }));
    await expect(post(API_LOGIN_URL, { phone: "x", password: "y" })).rejects.toThrow();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
    expect(window.sessionStorage.getItem(SESSION_EXPIRED_FLAG)).toBeNull();
    expect(hrefSet).toBeNull();
  });
});
