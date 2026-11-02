"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlantSummary, fetchTodaySales } from "../api/today-sales.api";

/** Ventas de hoy; se actualiza sola cada 2 minutos mientras Inicio esté abierto. */
export function useTodaySales(enabled: boolean) {
  return useQuery({
    queryKey: ["home", "today-sales"],
    queryFn: fetchTodaySales,
    enabled,
    refetchInterval: 2 * 60_000,
    refetchOnWindowFocus: true,
  });
}

/** Pedidos a planta para el Inicio de Planta; se actualiza cada minuto. */
export function usePlantSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["home", "plant-summary"],
    queryFn: fetchPlantSummary,
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
