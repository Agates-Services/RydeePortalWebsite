import { createContext } from "react";
import type { Profile } from "@/types/profile";

export interface AuthContextValue {
  profile: Profile | null;
  userId: string | null;
  login: (profile: Profile, userId?: string | null, accessToken?: string | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
