"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPosTicket } from "../api/pos-tickets.api";

/** Detalle de una orden; no pide nada mientras no haya una seleccionada. */
export function usePosTicket(id: number | null) {
  return useQuery({
    queryKey: ["pos-tickets", "detail", id],
    queryFn: () => fetchPosTicket(id as number),
    enabled: id !== null,
  });
}
