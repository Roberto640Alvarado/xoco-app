"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { meRequest } from "../api/auth.api";

/**
 * Al montar la app, lee el accessToken de la cookie httpOnly (JS del
 * navegador no puede leerla directamente) y, si existe, refresca los datos
 * del usuario contra /auth/me — así el store de Zustand (en memoria) queda
 * poblado de nuevo tras un refresh de página o abrir un tab nuevo.
 */
export function useSessionHydration() {
  const setSession = useAuthStore((state) => state.setSession);
  const clear = useAuthStore((state) => state.clear);
  const markHydrated = useAuthStore((state) => state.markHydrated);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const res = await fetch("/api/auth/session");
        const { data } = (await res.json()) as { data: { accessToken: string | null } };

        if (!data.accessToken) {
          if (!cancelled) markHydrated();
          return;
        }

        useAuthStore.setState({ accessToken: data.accessToken });
        const user = await meRequest();

        if (!cancelled) {
          setSession(data.accessToken, user);
        }
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) markHydrated();
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
