import { create } from "zustand";
import type { AuthUser } from "@/features/auth/types/auth.types";

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  markHydrated: () => void;
  clear: () => void;
}

/**
 * Estado de sesión en memoria (nunca persistido en localStorage/sessionStorage).
 * La cookie httpOnly (ver app/api/auth/session/route.ts) es la fuente de
 * verdad entre recargas; este store solo mantiene el accessToken accesible
 * para el interceptor de axios durante la sesión activa del tab.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  isHydrated: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setUser: (user) => set({ user }),
  markHydrated: () => set({ isHydrated: true }),
  clear: () => set({ accessToken: null, user: null }),
}));
