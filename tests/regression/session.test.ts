import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_MAX_AGE_MS,
  SESSION_STORAGE_KEY,
  clearSession,
  loadSession,
  saveSession,
} from "@/features/auth/session";
import type { Profile } from "@/types/profile";

const rider: Profile = { role: "Rider", name: "Rida Rider" };

beforeEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

describe("D9 — session envelope roundtrip (v3)", () => {
  it("saveSession then loadSession returns userId, accessToken, and profile", () => {
    saveSession(rider, "USER#0300111111", "jwt-token");
    expect(loadSession()).toEqual({
      userId: "USER#0300111111",
      accessToken: "jwt-token",
      profile: rider,
    });
  });

  it("saveSession without optional values defaults them to null", () => {
    saveSession(rider);
    expect(loadSession()).toEqual({ userId: null, accessToken: null, profile: rider });
  });

  it("stores a v3 envelope shape with the access token", () => {
    saveSession(rider, "USER#0300111111", "jwt-token");
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as {
      v: number;
      userId: string | null;
      accessToken: string | null;
      profile: Profile;
      savedAt: number;
    };
    expect(parsed.v).toBe(3);
    expect(parsed.userId).toBe("USER#0300111111");
    expect(parsed.accessToken).toBe("jwt-token");
    expect(parsed.profile).toEqual(rider);
    expect(typeof parsed.savedAt).toBe("number");
  });

  it("clearSession removes the storage key", () => {
    saveSession(rider);
    clearSession();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(loadSession()).toBeNull();
  });
});

describe("D9 — rejection paths (all must clear storage AND return null)", () => {
  it("TTL just BEFORE the boundary is honored (returns session)", () => {
    const nowStore = Date.now() - (SESSION_MAX_AGE_MS - 1000);
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 2, userId: "USER#1", profile: rider, savedAt: nowStore }),
    );
    expect(loadSession()).toEqual({ userId: "USER#1", accessToken: null, profile: rider });
  });

  it("TTL past the boundary → null + storage cleared", () => {
    const nowStore = Date.now() - (SESSION_MAX_AGE_MS + 1000);
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 2, userId: null, profile: rider, savedAt: nowStore }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("corrupt JSON → null + storage cleared", () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, "{not-json");
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("v1 envelope is treated as expired → null + storage cleared (forced re-login)", () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 1, profile: rider, savedAt: Date.now() }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("unknown future version → null + storage cleared", () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 3, userId: "x", profile: rider, savedAt: Date.now() }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("non-string userId (and not null) → null + storage cleared", () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 2, userId: 42, profile: rider, savedAt: Date.now() }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("missing/non-string profile.role → null + storage cleared", () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 2, userId: null, profile: { name: "no-role" }, savedAt: Date.now() }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 2, userId: null, profile: { role: 42 }, savedAt: Date.now() }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("non-object envelope (null/array/primitive) → null + cleared", () => {
    for (const bad of ["null", "42", '"str"', "[]"]) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, bad);
      expect(loadSession()).toBeNull();
      expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    }
  });
});
