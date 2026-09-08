"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rotateOdooConfig } from "../api/odoo-config.api";
import type { ApiError } from "@/lib/api/client";
import type { OdooConfigStatus, RotateOdooConfigPayload } from "../types/odoo-config.types";

export function useRotateOdooConfig() {
  const queryClient = useQueryClient();

  return useMutation<OdooConfigStatus, ApiError, RotateOdooConfigPayload>({
    mutationFn: rotateOdooConfig,
    onSuccess: (data) => {
      queryClient.setQueryData(["odoo-config"], data);
    },
  });
}
