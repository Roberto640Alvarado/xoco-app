"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";

/**
 * Vacía la caché de React Query cada vez que cambia QUIÉN está en sesión
 * (login, logout, 401, cambio de cuenta sin recargar). El login/logout
 * navegan con router.push, así que el QueryClient sobrevive entre sesiones:
 * sin esto, datos que la API recorta por rol (ej. /sales/stores, que a un
 * Vendedor le devuelve solo su tienda) se le seguían mostrando al siguiente
 * usuario del mismo navegador hasta que vencía su staleTime.
 *
 * Compara por id de usuario: refrescar el perfil del mismo usuario
 * (setUser, ej. permisos) no limpia nada.
 */
export function useClearCacheOnUserChange() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let previousUserId = useAuthStore.getState().user?.id ?? null;

    return useAuthStore.subscribe((state) => {
      const currentUserId = state.user?.id ?? null;
      if (currentUserId === previousUserId) return;

      previousUserId = currentUserId;
      // Cancela lo que siga en vuelo con el token anterior y descarta todo
      // lo cacheado: cada pantalla vuelve a pedir sus datos ya con el
      // usuario nuevo.
      void queryClient.cancelQueries();
      queryClient.removeQueries();
    });
  }, [queryClient]);
}
