import type { Profile } from "@/types/profile";

export const SESSION_VERSION = 2;

// Client-side maximum session age. Approximates a token time-to-live until the
// backend provides real access/refresh tokens; the user is force-logged-out once
// this window elapses regardless of activity.
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const SESSION_STORAGE_KEY = "rydee.session";

// Version-tagged envelope. v2 adds the backend-issued userId alongside the
// profile. Older (v1) payloads no longer match the shape and are treated as
// logged-out and dropped on load, forcing a clean re-login.
export interface SessionEnvelopeV2 {
  v: 2;
  userId: string | null;
  profile: Profile;
  savedAt: number;
}

export interface Session {
  userId: string | null;
  profile: Profile;
}

function isEnvelopeV2(value: unknown): value is SessionEnvelopeV2 {
  if (typeof value !== "object" || value === null) return false;
  const rec = value as Record<string, unknown>;
  if (rec.v !== 2) return false;
  if (typeof rec.savedAt !== "number") return false;
  if (!(rec.userId === null || typeof rec.userId === "string")) return false;
  const profile = rec.profile;
  if (typeof profile !== "object" || profile === null) return false;
  // Only require that role is a string here; the route guards and roleHome
  // already tolerate unknown role values, so validating the enum here would
  // duplicate that logic and reject sessions the guards can handle safely.
  return typeof (profile as { role?: unknown }).role === "string";
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSession(): Session | null {
  const s = storage();
  if (!s) return null;
  const raw = s.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }

  if (!isEnvelopeV2(parsed)) {
    // v1 (or any unknown/corrupt) envelope is treated as expired: clear it so
    // the user re-logs in and every subsequent mount stops re-parsing the blob.
    clearSession();
    return null;
  }

  if (Date.now() - parsed.savedAt > SESSION_MAX_AGE_MS) {
    clearSession();
    try {
      window.sessionStorage.setItem("rydee.expired", "1");
    } catch {
      /* storage unavailable */
    }
    return null;
  }

  return { userId: parsed.userId, profile: parsed.profile };
}

export function saveSession(profile: Profile, userId: string | null = null): void {
  const s = storage();
  if (!s) return;
  const envelope: SessionEnvelopeV2 = {
    v: SESSION_VERSION,
    userId,
    profile,
    savedAt: Date.now(),
  };
  try {
    s.setItem(SESSION_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Storage full or disabled: fall back to in-memory-only session state.
  }
}

export function clearSession(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore: nothing actionable if removeItem itself throws.
  }
}
