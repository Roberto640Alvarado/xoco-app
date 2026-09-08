"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStores } from "../api/sales.api";

export function useStores() {
  return useQuery({
    queryKey: ["sales", "stores"],
    queryFn: fetchStores,
    staleTime: 5 * 60 * 1000,
  });
}
