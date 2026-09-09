"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../api/users.api";
import type { ApiError } from "@/lib/api/client";
import type { AppUser, UpdateUserPayload } from "../types/users.types";

interface UpdateUserVariables extends UpdateUserPayload {
  id: string;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<AppUser, ApiError, UpdateUserVariables>({
    mutationFn: ({ id, ...payload }) => updateUser(id, payload),
    onSuccess: (user) => {
      queryClient.setQueryData<AppUser[]>(["users"], (current) =>
        current?.map((item) => (item.id === user.id ? user : item)),
      );
    },
  });
}
