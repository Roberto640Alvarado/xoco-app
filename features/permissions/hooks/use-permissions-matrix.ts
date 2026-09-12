"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPermissionsMatrix } from "../api/permissions.api";

export function usePermissionsMatrix() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: fetchPermissionsMatrix,
  });
}
