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
    enabled: isHydrated && !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

/** ¿Este usuario puede usar Inventario? Admin/Finanzas siempre; el Vendedor
 * solo si habilitaron su tienda. `isLoading` evita parpadeos mientras llega
 * la respuesta (mientras tanto el Vendedor se trata como "no habilitado"). */
export function useCanUseInventory(): { canUse: boolean; isLoading: boolean } {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useInventoryAccess();
  if (!user) return { canUse: false, isLoading };
  if (user.role !== "VENDEDOR") return { canUse: true, isLoading: false };
  const enabled = user.posConfigId != null && (data?.enabledPosConfigIds.includes(user.posConfigId) ?? false);
  return { canUse: enabled, isLoading };
}
