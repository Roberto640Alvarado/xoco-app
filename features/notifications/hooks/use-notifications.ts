"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { readLastSeen } from "@/features/inventory-movements/lib/last-seen";
import { fetchNotifications } from "../api/notifications.api";

/** Notificaciones del usuario (se actualizan cada minuto y al volver a la pestaña). */
export function useNotifications() {
  const user = useAuthStore((state) => state.user);
  // El Vendedor cuenta como novedad lo resuelto después de su última visita a Movimientos.
  const since = user?.role === "VENDEDOR" && user.email ? readLastSeen(user.email) : undefined;
  return useQuery({
    queryKey: ["notifications", user?.id, since],
    queryFn: () => fetchNotifications(since),
    enabled: Boolean(user),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
