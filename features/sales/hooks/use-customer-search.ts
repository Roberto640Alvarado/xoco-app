"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomerSearch } from "../api/sales.api";
import type { CustomerSearchFilters } from "../types/sales.types";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 350;

// Debounce local del texto de búsqueda: sin esto, cada tecla dispara un
// request nuevo contra Odoo (que no es barato — es un read_group con
// domain de fecha + ilike sobre account.move). La query queda
// deshabilitada mientras el texto tenga menos de 2 caracteres, igual que
// exige el DTO del backend.
export function useCustomerSearch(filters: CustomerSearchFilters) {
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(filters.q), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const trimmedQ = debouncedQ.trim();

  return useQuery({
    queryKey: ["sales", "customer-search", { ...filters, q: trimmedQ }],
    queryFn: () => fetchCustomerSearch({ ...filters, q: trimmedQ }),
    enabled: trimmedQ.length >= MIN_QUERY_LENGTH,
  });
}
