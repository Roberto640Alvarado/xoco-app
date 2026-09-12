"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPaymentMethodsSummary } from "../api/sales.api";
import type { SalesFilters } from "../types/sales.types";

export function usePaymentMethodsSummary(filters: SalesFilters) {
  return useQuery({
    queryKey: ["sales", "payment-methods-summary", filters],
    queryFn: () => fetchPaymentMethodsSummary(filters),
  });
}
