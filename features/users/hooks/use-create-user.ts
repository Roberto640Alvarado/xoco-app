"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../api/users.api";
import type { ApiError } from "@/lib/api/client";
import type { AppUser, CreateUserPayload } from "../types/users.types";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<AppUser, ApiError, CreateUserPayload>({
    mutationFn: createUser,
    onSuccess: (user) => {
      queryClient.setQueryData<AppUser[]>(["users"], (current) =>
        current ? [...current, user] : [user],
      );
    },
  });
}
