# Login y validación de rol (xoco-app)

## Contexto

`xoco-app` estaba en el scaffold por defecto de `create-next-app` + shadcn
(solo `Button` instalado, sin auth de ningún tipo). Con el login y los
guards ya funcionando en `xoco-api`, se construyó el flujo de autenticación
del lado del frontend: página de login, cookie de sesión httpOnly,
middleware que protege `/dashboard` y valida el rol (`SUPER_ADMIN` /
`FINANZAS`), y un panel mínimo que confirma la sesión. Se siguió el mismo
patrón ya probado en `ecoguide-app` (axios + interceptor, Zustand en
memoria, cookie httpOnly + middleware que decodifica el JWT sin verificar
firma solo para UX de redirección), adaptado a los dos roles de
Xocolatísimo y a que aquí **no hay separación de árbol de rutas por rol**
(a diferencia de `/student` vs `/teacher` en ecoguide) — ambos roles
comparten `/dashboard`, y solo `/dashboard/admin/**` queda reservado a
`SUPER_ADMIN`.

## Diseño

- `store/auth-store.ts` — Zustand en memoria (nunca localStorage): `accessToken`, `user`, `isHydrated`.
- `lib/api/client.ts` — cliente axios hacia `xoco-api` (`NEXT_PUBLIC_API_URL`, nuevo `.env.local`/`.env.example`). Adjunta `Authorization: Bearer` desde el store en cada request. A diferencia de `ecoguide-app`, **no desenvuelve ningún envelope** — `xoco-api` devuelve el payload directo (ver plan-history de Sales/Auth en `xoco-api`). Un 401 fuera de `/auth/login` limpia la sesión y redirige a `/login` (via un handler registrado en `Providers`, para evitar un full page reload).
- `features/auth/` — mismo desglose que ecoguide (`types`, `schemas` con Zod, `api`, `hooks`): `useLogin` (llama `/auth/login`, guarda la cookie vía `POST /api/auth/session`, hidrata el store, redirige a `?redirect=` o `/dashboard`), `useSessionHydration` (al montar la app, lee la cookie vía `GET /api/auth/session` y refresca `/auth/me`), `useLogout`.
- `app/api/auth/session/route.ts` — cookie httpOnly `xoco_token` (`POST` la crea, `GET` la expone al cliente para hidratar, `DELETE` la borra). El JS del navegador nunca lee el JWT directamente.
- `middleware.ts` — decodifica el payload del JWT (sin verificar firma — la firma la valida siempre `xoco-api`) para: (1) sacar de `/login` a quien ya tiene sesión, (2) mandar a `/login?redirect=...` a quien entra a `/dashboard/**` sin sesión (o con token vencido/corrupto), (3) devolver a `/dashboard` a cualquier sesión `FINANZAS` que intente entrar a `/dashboard/admin/**`.
- `app/(auth)/login/page.tsx` — formulario con `react-hook-form` + Zod, usando los componentes shadcn ya instalados (`Button`) más `Input`/`Label`/`Card` (instalados en esta sesión vía `npx shadcn add`).
- `app/dashboard/layout.tsx` — header con email + badge de rol + botón de salir; `app/dashboard/page.tsx` — placeholder que confirma la sesión y el rol (los endpoints reales de `/sales/orders` y `/sales/top-products` quedan para el siguiente paso); `app/dashboard/admin/page.tsx` — placeholder protegido solo para `SUPER_ADMIN`.
- `app/page.tsx` — redirige siempre a `/login`; el middleware decide el destino final según haya o no sesión.

## Verificación en vivo

Se compiló (`npm run build`, Turbopack) y se levantaron **ambos** servidores reales (`xoco-api` en 4005, `xoco-app` en 3010) dentro de una sola invocación de shell, con login real contra el `SUPER_ADMIN` sembrado:

- `GET /` sin cookie → `307` a `/login`.
- `GET /dashboard` sin cookie → `307` a `/login?redirect=%2Fdashboard`.
- `POST /auth/login` (xoco-api) → token real.
- `POST /api/auth/session` (xoco-app) → guarda la cookie.
- `GET /dashboard` con cookie → `200`.
- `GET /dashboard/admin` con cookie de `SUPER_ADMIN` → `200`.
- `GET /login` con cookie → `307` a `/dashboard` (ya logueado).

`npm run lint` (eslint) — 0 errores (1 warning preexistente en el fallback de `window.location.href` del interceptor, igual que en ecoguide-app, es intencional).

Nota de entorno: el build de Turbopack falló en este contenedor Linux del
puente remoto por faltar el binario nativo `lightningcss-linux-arm64-gnu`
(el `node_modules` que existe en tu Mac solo tenía el de `darwin-arm64`,
por haberse instalado ahí) — se instaló temporalmente (`--no-save`, no
quedó en `package.json`/lock) solo para poder verificar el build desde
aquí. No debería afectar tu `npm run dev`/`npm run build` normal en tu
Terminal, que ya tiene el binario correcto de macOS.

## Pendiente

- No se probó en vivo el bloqueo de `/dashboard/admin` para un usuario `FINANZAS` real — no existe todavía ninguna cuenta con ese rol (ver plan-history de `xoco-api`, sección Pendiente).
- `/dashboard` es un placeholder — los endpoints reales de Sales (`/sales/orders`, `/sales/top-products`) van en el siguiente paso.
- No hay pantalla de "olvidé mi contraseña" (`xoco-api` tampoco la expone todavía — ver CLAUDE.md, sección "Recuperación de Contraseña", queda como TODO en ambos proyectos).
