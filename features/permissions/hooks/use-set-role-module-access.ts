"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setRoleModuleAccess } from "../api/permissions.api";
import type { ApiError } from "@/lib/api/client";
import type { RoleModuleAccessRow, SetRoleModuleAccessPayload } from "../types/permissions.types";

export function useSetRoleModuleAccess() {
  const queryClient = useQueryClient();

  return useMutation<RoleModuleAccessRow, ApiError, SetRoleModuleAccessPayload>({
    mutationFn: setRoleModuleAccess,
    onSuccess: (updated) => {
      queryClient.setQueryData<RoleModuleAccessRow[]>(["permissions"], (current) =>
        current?.map((row) =>
          row.role === updated.role && row.moduleKey === updated.moduleKey ? updated : row,
        ),
      );
    },
  });
}
