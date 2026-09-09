"use client";

import { useMutation } from "@tanstack/react-query";
import { setUserPassword } from "../api/users.api";
import type { ApiError } from "@/lib/api/client";
import type { AppUser, SetUserPasswordPayload } from "../types/users.types";

interface SetUserPasswordVariables extends SetUserPasswordPayload {
  id: string;
}

// A diferencia de useCreateUser/useSetUserActive, esta mutación no
// actualiza la caché de ["users"] — la respuesta no trae ningún campo
// visible en la tabla que haya cambiado (la contraseña nunca se expone).
export function useSetUserPassword() {
  return useMutation<AppUser, ApiError, SetUserPasswordVariables>({
    mutationFn: ({ id, ...payload }) => setUserPassword(id, payload),
  });
}
