"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { fetchMovementNotifications } from "../api/inventory-movements.api";
import { readLastSeen } from "../lib/last-seen";

const MODULE_KEY = "dashboard.inventario-movimientos";

// Contadores de los globos del menú (Inventario → Movimientos y Solicitudes). Se vuelve a
// consultar cada minuto y al volver a la pestaña; las altas y cambios de
// estado hechos desde esta misma app lo invalidan al instante (ver
// hooks de mutación). No consulta si el usuario no tiene el módulo.
export function useMovementNotifications() {
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hasModule = user?.permissions?.[MODULE_KEY] !== false;

  return useQuery({
    queryKey: ["inventory", "notifications", user?.email],
    queryFn: () =>
      fetchMovementNotifications(
        user?.role === "VENDEDOR"
          ? { sinceMovements: readLastSeen(user.email, "movements"), sinceRequests: readLastSeen(user.email, "requests") }
          : {},
      ),
    enabled: isHydrated && !!user && hasModule,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}
