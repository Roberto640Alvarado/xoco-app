"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { meRequest } from "../api/auth.api";

// Los permisos del usuario llegan con el login y con /auth/me al cargar la
// página. Si el Admin cambia un permiso o un rol mientras la persona tiene
// la sesión abierta, el menú no se enteraba hasta recargar. Este hook vuelve
// a consultar /auth/me cada minuto y al volver a la pestaña, y actualiza el
// usuario solo cuando cambió el rol o algún permiso.
export function usePermissionsRefresh() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: ["auth", "me", user?.id],
    queryFn: meRequest,
    enabled: isHydrated && !!user,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const fresh = query.data;
  useEffect(() => {
    if (!fresh || !user) return;
    const changed = fresh.role !== user.role || JSON.stringify(fresh.permissions) !== JSON.stringify(user.permissions);
    if (changed) setUser(fresh);
  }, [fresh, user, setUser]);
}
