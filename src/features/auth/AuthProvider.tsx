import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import type { Profile } from "@/types/profile";
import { clearSession, loadSession, saveSession } from "./session";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadSession();
  const [profile, setProfile] = useState<Profile | null>(initial?.profile ?? null);
  const [userId, setUserId] = useState<string | null>(initial?.userId ?? null);
  const userIdRef = useRef<string | null>(initial?.userId ?? null);

  const login = useCallback((next: Profile, nextUserId?: string | null) => {
    // A profile refresh (My Profile save) omits userId and must not drop the
    // existing one; a fresh login passes the backend-issued userId explicitly.
    const resolved = nextUserId === undefined ? userIdRef.current : nextUserId;
    userIdRef.current = resolved;
    saveSession(next, resolved);
    setProfile(next);
    setUserId(resolved);
  }, []);

  // Logout must also clear storage: without it, the next render would rehydrate the same profile and loop.
  const logout = useCallback(() => {
    clearSession();
    userIdRef.current = null;
    setProfile(null);
    setUserId(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ profile, userId, login, logout }),
    [profile, userId, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
