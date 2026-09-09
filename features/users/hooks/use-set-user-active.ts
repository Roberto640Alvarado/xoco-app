"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setUserActive } from "../api/users.api";
import type { ApiError } from "@/lib/api/client";
import type { AppUser } from "../types/users.types";

interface SetUserActiveVariables {
  id: string;
  isActive: boolean;
}

export function useSetUserActive() {
  const queryClient = useQueryClient();

  return useMutation<AppUser, ApiError, SetUserActiveVariables>({
    mutationFn: ({ id, isActive }) => setUserActive(id, isActive),
    onSuccess: (user) => {
      queryClient.setQueryData<AppUser[]>(["users"], (current) =>
        current?.map((item) => (item.id === user.id ? user : item)),
      );
    },
  });
}
