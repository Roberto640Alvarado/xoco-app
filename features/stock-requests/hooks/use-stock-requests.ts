"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import {
  fetchStockRequest,
  fetchStockRequestCatalog,
  fetchStockRequestNotifications,
  fetchStockRequestSources,
  fetchStockRequests,
} from "../api/stock-requests.api";
import type { StockRequestFilters } from "../types/stock-request.types";

const MODULE_KEY = "dashboard.inventario-solicitudes";

// Listado de solicitudes. Se refresca cada 30 s y al volver a la pestaña:
// planta y tienda se avisan entre sí por aquí (no hay push).
export function useStockRequests(filters: StockRequestFilters) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ["stock-requests", "list", filters],
    queryFn: () => fetchStockRequests(filters),
    enabled: isHydrated && !!user,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useStockRequest(id: string | null) {
  return useQuery({
    queryKey: ["stock-requests", "detail", id],
    queryFn: () => fetchStockRequest(id as string),
    enabled: id != null,
    refetchInterval: 30_000,
  });
}

// Catálogo de Odoo (solo lectura): la tienda lo usa para pedir y planta
// para agregar productos. Casi no cambia, por eso el staleTime largo.
export function useStockRequestCatalog(enabled: boolean) {
  return useQuery({
    queryKey: ["stock-requests", "catalog"],
    queryFn: fetchStockRequestCatalog,
    enabled,
    staleTime: 5 * 60_000,
  });
}

// Globo del menú: planta ve lo que falta por responder o despachar, la
// tienda ve los envíos en camino por confirmar. Admin/Finanzas no reciben
// aviso (solo hacen seguimiento).
export function useStockRequestNotifications() {
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const gets = user?.role === "VENDEDOR" || user?.role === "PLANTA";
  const hasModule = user?.permissions?.[MODULE_KEY] !== false;
  return useQuery({
    queryKey: ["stock-requests", "notifications", user?.email],
    queryFn: fetchStockRequestNotifications,
    enabled: isHydrated && !!user && gets && hasModule,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

/** Tiendas a las que se les puede pedir además de planta (solo al abrir "Nueva solicitud"). */
export function useStockRequestSources(enabled: boolean) {
  return useQuery({
    queryKey: ["stock-requests", "sources"],
    queryFn: fetchStockRequestSources,
    enabled,
    staleTime: 60_000,
  });
}
