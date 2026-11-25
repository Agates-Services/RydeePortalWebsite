import type { Profile } from "@/types/profile";

export const SESSION_VERSION = 3;

// Client-side maximum session age. Approximates a token time-to-live until the
// backend provides real access/refresh tokens; the user is force-logged-out once
// this window elapses regardless of activity.
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const SESSION_STORAGE_KEY = "rydee.session";

// Version-tagged envelope. v2 adds the backend-issued userId alongside the
// profile. Older (v1) payloads no longer match the shape and are treated as
// logged-out and dropped on load, forcing a clean re-login.
export interface SessionEnvelopeV3 {
  v: 3;
  userId: string | null;
  accessToken: string | null;
  profile: Profile;
  savedAt: number;
}

export interface Session {
  userId: string | null;
  accessToken: string | null;
  profile: Profile;
}

function isValidEnvelope(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const rec = value as Record<string, unknown>;
  if (!(rec.v === 2 || rec.v === 3)) return false;
  if (typeof rec.savedAt !== "number") return false;
  if (!(rec.userId === null || typeof rec.userId === "string")) return false;
  if (rec.v === 3 && !(rec.accessToken === null || typeof rec.accessToken === "string")) return false;
  const profile = rec.profile;
  if (typeof profile !== "object" || profile === null) return false;
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

  if (!isValidEnvelope(parsed)) {
    clearSession();
    return null;
  }

  const envelope = parsed as Record<string, unknown>;
  if (Date.now() - (envelope.savedAt as number) > SESSION_MAX_AGE_MS) {
    clearSession();
    try {
      window.sessionStorage.setItem("rydee.expired", "1");
    } catch {
      /* storage unavailable */
    }
    return null;
  }

  return {
    userId: envelope.userId as string | null,
    profile: envelope.profile as Profile,
    accessToken: typeof envelope.accessToken === "string" ? envelope.accessToken : null,
  };
}

export function saveSession(
  profile: Profile,
  userId: string | null = null,
  accessToken?: string | null,
): void {
  const s = storage();
  if (!s) return;

  let resolvedToken = accessToken ?? null;
  if (accessToken === undefined) {
    const existing = s.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as { accessToken?: unknown };
        resolvedToken = typeof parsed.accessToken === "string" ? parsed.accessToken : null;
      } catch {
        resolvedToken = null;
      }
    }
  }

  const envelope: SessionEnvelopeV3 = {
    v: SESSION_VERSION,
    userId,
    profile,
    accessToken: resolvedToken,
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
