"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOdooConfigHistory } from "../api/odoo-config.api";

export function useOdooConfigHistory() {
  return useQuery({
    queryKey: ["odoo-config-history"],
    queryFn: fetchOdooConfigHistory,
  });
}
