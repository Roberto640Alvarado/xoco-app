"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOdooConfig } from "../api/odoo-config.api";

export function useOdooConfig() {
  return useQuery({
    queryKey: ["odoo-config"],
    queryFn: fetchOdooConfig,
  });
}
