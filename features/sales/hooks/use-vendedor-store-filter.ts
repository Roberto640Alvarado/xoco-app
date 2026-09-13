"use client";

import { useAuthStore } from "@/store/auth-store";

/**
 * Un Vendedor está forzado en el servidor a ver solo SU propia tienda
 * (scopedPosConfigId) y el StoreSelect ya bloquea el control para él
 * (lockedToSingleStore) — pero eso no basta: el filtro de tienda con el
 * que arranca cada pantalla también debe empezar en esa tienda, no en
 * "Todas las tiendas" (que ni siquiera aparece en su lista de opciones,
 * ver components/filters/store-select.tsx). Sin esto, el selector se ve
 * bloqueado mostrando la opción equivocada en vez de la tienda real del
 * Vendedor ya seleccionada.
 *
 * Se centraliza acá porque el mismo criterio se repite en cada pantalla
 * que filtra por tienda (Resumen, Visitas, Productos, Categorías,
 * Formas de pago, Venta diaria, Tráfico diario, Ticket detallado).
 */
export function useVendedorStoreFilter(): {
  isVendedor: boolean;
  defaultPosConfigId: number | undefined;
} {
  const user = useAuthStore((state) => state.user);
  const isVendedor = user?.role === "VENDEDOR";
  return {
    isVendedor,
    defaultPosConfigId: isVendedor ? (user?.posConfigId ?? undefined) : undefined,
  };
}
