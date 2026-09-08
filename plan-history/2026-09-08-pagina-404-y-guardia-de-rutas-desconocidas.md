# Página 404 + guardia de rutas desconocidas

## Contexto

El middleware ya protegía `/dashboard/*` (sin sesión -> `/login`) y evitaba
que alguien con sesión volviera a ver `/login`, pero cualquier URL que no
matcheara ninguno de esos dos patrones (ej. `/asdf`, algo tecleado a mano o
un link roto) caía directo al 404 genérico de Next — incluso sin sesión.
Se pidió: sin sesión + URL errónea -> a login (nunca ver el 404, no hay
registro público así que no tiene caso dejar "explorar"); con sesión + URL
errónea -> sí mostrar un 404 real, con botón para volver al inicio.

## Diseño

### `lib/auth/decode-token.ts` (nuevo)

Se extrajo el `decodeToken()` (decodifica el payload del JWT sin verificar
firma — solo para decisiones de UX, la autorización real siempre la valida
xoco-api) que antes vivía inline en `middleware.ts`, junto con la constante
`AUTH_COOKIE_NAME`. Nada de lógica nueva, solo se sacó a un módulo
compartido para no duplicarlo entre el middleware y el 404.

### `middleware.ts`

- Nuevo helper `isKnownRoute(pathname)`: `true` para `/`, `/login`, y
  cualquier cosa bajo `/dashboard`. Cualquier otra ruta es "desconocida".
- Nueva regla, evaluada antes que el resto: sin sesión + ruta desconocida
  -> redirect a `/login` (sin `?redirect=`, no tiene caso volver a una URL
  inventada).
- El `matcher` pasó de una lista fija (`/login`, `/dashboard/:path*`) a
  cubrir toda la app **excepto** `_next/static`, `_next/image`,
  `favicon.ico`, `api/`, y una lista de extensiones de archivo estático
  (svg, png, css, js, woff, ...) — necesario para poder interceptar
  cualquier URL desconocida, pero hay que excluir los assets estáticos
  explícitamente o un ícono público cualquiera quedaría atrapado por el
  redirect a login cuando no hay sesión.

### `app/not-found.tsx` (nuevo)

Client Component (no Server Component leyendo `cookies()` directamente):
revisa `useAuthStore` (ya hidratado desde la cookie httpOnly por
`AuthHydrator`, mismo mecanismo que ya usa toda la app) y, si tras
hidratar no hay `user`, hace `router.replace("/login")`. Mientras hidrata,
muestra el mismo spinner que `DashboardShell` ya usa para ese estado
intermedio — mismo patrón, no uno nuevo.

Se probó primero como Server Component leyendo `cookies()` de
`next/headers`, pero eso es una API dinámica y, al usarse en el 404 raíz
(fallback potencial de cualquier ruta), forzaba a Next a renderizar **toda**
la app dinámicamente (las 6 páginas que antes eran estáticas pasaron a
`ƒ Dynamic` en el build) — se descartó por eso.

Con sesión, muestra un 404 simple (ícono, "Error 404", "Página no
encontrada", texto corto) y un botón "Ir al inicio" (`getDashboardPath()`,
ya existente — mismo destino para ambos roles) usando el patrón `render`
de los componentes base-ui de este proyecto (no `asChild`, que es de
Radix).

## Verificación

- `npm run build` — las 6 rutas reales vuelven a salir `○ Static` (se
  confirmó que NO quedaron dinámicas tras el cambio a Client Component).
- `npm run lint` — 0 errores (el único warning es el preexistente de
  `window.location.href`).
- En vivo (servidor real en una sola invocación de shell, con `curl`):
  - `GET /una-url-que-no-existe` sin cookie -> `307` a `/login`.
  - `GET /dashboard/algo-raro` sin cookie -> `307` a
    `/login?redirect=%2Fdashboard%2Falgo-raro` (sigue conservando el
    redirect de vuelta cuando la URL desconocida SÍ está bajo `/dashboard`).
  - `GET /login` sin cookie -> `200` (sigue accesible, obvio pero se
    confirmó que el guard nuevo no lo rompió).
  - `GET /favicon.ico` -> `200` (el matcher lo excluye correctamente, no
    quedó atrapado por la regla nueva).
  - `GET /otra-url-inventada` con una cookie con forma de JWT válido (rol
    `SUPER_ADMIN`, sin verificar firma — el middleware no verifica firma
    por diseño) -> `404` real de Next, contenido de la página presente
    (el spinner de carga, ya que `curl` no ejecuta JS y no llega a
    hidratar) — confirma que el middleware deja pasar la ruta y que
    `app/not-found.tsx` renderiza sin errores.

## Pendiente

- No se pudo probar el flujo completo con una sesión real verificada por
  el backend (llegar a ver el texto "Página no encontrada" + botón
  después de que `/auth/me` confirme la sesión) — hace falta la
  contraseña real del `SUPER_ADMIN` sembrado, que no está disponible en
  esta sesión. Vale la pena que lo confirmes tú una vez logueado: entra a
  una URL inventada (ej. `/dashboard/lo-que-sea-123`) y deberías ver la
  página de 404 con el botón, no el genérico de Next.
