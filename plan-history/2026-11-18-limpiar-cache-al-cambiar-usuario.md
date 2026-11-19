# Limpiar la caché de React Query al cambiar de usuario

## Objetivo

Evitar que datos cacheados de una sesión se le muestren al siguiente usuario que entra en el mismo navegador.

## Contexto (bug reportado)

En Inventario y en Administración → Inventario por tienda solo aparecía "Tienda Ramblas" (faltaban CENTRIKA, San Benito y Escalón). Odoo y la API devolvían las 4 tiendas correctamente.

Causa: `GET /sales/stores` le devuelve a un VENDEDOR únicamente su tienda. Esa respuesta quedaba en la caché bajo `["sales", "stores"]` (sin usuario en la llave, `staleTime` de 5 min). Login y logout navegan con `router.push`, así que el `QueryClient` sobrevivía al cambio de sesión y el siguiente usuario (Admin/Finanzas) veía la lista recortada del Vendedor hasta que vencía la caché o recargaba la página.

## Cambios realizados

- `features/auth/hooks/use-clear-cache-on-user-change.ts` (nuevo): se suscribe al `auth-store` y, cuando cambia el id del usuario en sesión (login, logout, 401, cambio de cuenta), cancela las queries en vuelo y elimina toda la caché.
- `app/providers.tsx`: monta `QueryCacheSessionGuard` dentro del `QueryClientProvider`.

## Razones del cambio

- Un solo punto central en vez de limpiar en `useLogin`, `useLogout` y el interceptor 401 por separado: cubre también flujos futuros que cambien la sesión.
- Compara por id: refrescar el perfil del mismo usuario (`setUser`, permisos) no vacía la caché.
- Arregla de raíz cualquier otro endpoint que la API recorte por rol, no solo `/sales/stores`.

## Resultado final

Al cerrar sesión y entrar con otra cuenta sin recargar, cada pantalla vuelve a pedir sus datos con el usuario nuevo; Admin/Finanzas ven todas las tiendas.
