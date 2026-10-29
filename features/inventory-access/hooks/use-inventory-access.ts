"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { fetchInventoryAccess } from "../api/inventory-access.api";

// Qué tiendas tienen Inventario habilitado para sus Vendedores — decide si
// el Vendedor ve la sección (menú + páginas) y alimenta el aviso de
// Admin/Finanzas y la pantalla de Administración.
export function useInventoryAccess() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["inventory", "access"],
    queryFn: fetchInventoryAccess,
    // Planta no tiene este endpoint (y no lo necesita: solo ve Solicitudes).
    enabled: isHydrated && !!user && user.role !== "PLANTA",
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export type InventoryBlockReason = "user" | "store" | null;

/** ¿Este usuario puede usar Inventario? Admin/Finanzas siempre; el Vendedor
 * solo si tiene acceso individual (`inventoryEnabled`) Y habilitaron su
 * tienda. `isLoading` evita parpadeos mientras llega la respuesta (mientras
 * tanto el Vendedor se trata como "no habilitado"). `blockedBy` dice cuál de
 * las dos condiciones falta, para el mensaje del gate. */
export function useCanUseInventory(): { canUse: boolean; isLoading: boolean; blockedBy: InventoryBlockReason } {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useInventoryAccess();
  if (!user) return { canUse: false, isLoading, blockedBy: null };
  if (user.role !== "VENDEDOR") return { canUse: true, isLoading: false, blockedBy: null };
  if (!user.inventoryEnabled) return { canUse: false, isLoading: false, blockedBy: "user" };
  const storeEnabled = user.posConfigId != null && (data?.enabledPosConfigIds.includes(user.posConfigId) ?? false);
  return { canUse: storeEnabled, isLoading, blockedBy: storeEnabled ? null : "store" };
}
