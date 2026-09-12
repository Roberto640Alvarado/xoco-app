# CLAUDE.md

Este archivo proporciona lineamientos para Claude Code (claude.ai/code) al trabajar sobre este repositorio.

## Reglas

- Nunca incluir "Co-Authored-By", "Anthropic", "Claude" o "Claude Code" en mensajes de commit ni en ninguna salida relacionada con Git.
- Cada vez que completes un task, muestra un emoji de cohete 🚀 al final del mensaje.
- No releer ni listar automáticamente el contenido de `plan-history/` al iniciar una tarea — solo consultarla si el usuario lo pide explícitamente.

---

# Descripción del Proyecto

Xocolatísimo Panel es el frontend (Next.js) del panel administrativo interno de Xocolatísimo. Es una plataforma 100% administrativa — no tiene un lado "público"/estudiante como otros proyectos — pensada para que **SUPER_ADMIN** y **FINANZAS** consulten reportes, gráficas y números del negocio (ventas, principalmente) alimentados desde Odoo.

Este proyecto consume la API REST **Xocolatísimo API** (NestJS + MongoDB + Prisma, repositorio hermano `xocolatisimo-api`). El frontend no tiene base de datos propia ni lógica de negocio: toda la validación real, autorización y persistencia vive en la API. Aquí solo se construyen las vistas, el estado de cliente y la orquestación de llamadas HTTP.


---

## Commands

```bash
npm run dev                # Desarrollo (Next.js dev server)
npm run build               # Compilar proyecto
npm run start                # Servir build de producción
npm run lint                 # ESLint
```

---

# Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- shadcn/ui (Radix UI + Tailwind) — librería de componentes base del proyecto
- Framer Motion — animaciones e interacciones (micro-interacciones, transiciones de vista, reveals); ver "Sistema de Diseño" para lineamientos de uso
- TanStack React Query — data fetching, cache, mutaciones contra la API
- TanStack React Table — tablas del panel (listados de ventas, reportes, usuarios)
- React Hook Form + Zod + `@hookform/resolvers` — formularios y validación, en espejo de los DTOs de la API
- Axios — cliente HTTP (instancia única con interceptor de auth)
- Zustand — estado de cliente que no vive en la API (UI state, no cache de servidor)
- nuqs — sincroniza filtros de listados (`page`, `limit`, `search`, `sort`, filtros de fecha) con la URL
- Recharts — gráficas (dashboard de ventas/finanzas — es el corazón visual del producto)
- input-otp — código de recuperación de contraseña (6 dígitos)
- Lucide React — iconos
- next-themes — modo claro/oscuro
- nextjs-toploader — barra de progreso de navegación

No se usa: NextAuth (auth propia contra el JWT de la API — ver sección Autenticación), SWR ni dayjs (redundantes con react-query y date-fns respectivamente).


---

# Arquitectura

Next.js App Router.


```
app/
  (auth)/
    login/
    forgot-password/
    reset-password/
  (dashboard)/
    layout.tsx              # <AppSidebar> — visibilidad de secciones según rol
    dashboard/               # KPIs / resumen general
    ventas/                   # Módulo de ventas: listados, filtros, detalle
    reportes/                 # Reportes y gráficas (Recharts)
  api/
    auth/
      session/               # route handler propio: set/get/delete de la cookie httpOnly del JWT
  layout.tsx
  providers.tsx            # React Query Provider, ThemeProvider, hidratación de sesión

middleware.ts               # Protección del panel por rol, leyendo la cookie del JWT

features/
  <feature>/                # auth, users, sales, reports, ...
    api/                    # funciones que llaman a la API (usan el cliente de lib/api)
    hooks/                  # hooks de React Query (useXQuery, useXMutation)
    components/             # componentes propios de la feature
    schemas/                # esquemas Zod (mismo shape que los DTOs de la API)
    types/                  # tipos TS (mismo shape que los doc/*.doc.ts de la API)

components/
  ui/                       # componentes shadcn/ui y composiciones reutilizables entre features
  layout/                   # Navbar, Sidebar, Shell

lib/
  api/
    client.ts               # instancia de axios + interceptor de auth + manejo del envelope
  utils/

hooks/                      # hooks genéricos no atados a una feature
store/                      # stores de Zustand (UI state)
types/                      # tipos compartidos entre features (ej. PaginatedResult<T>)

plan-history/
```

Cada `feature/` es independiente: no importar componentes ni hooks de una feature dentro de otra directamente. Si dos features necesitan compartir algo, ese algo sube a `components/`, `lib/` o `types/`.

---

# Alias

Siempre utilizar los alias configurados en `tsconfig.json`.

```
@/*                  → raíz del proyecto
@/app/*              → app/
@/features/*         → features/
@/components/*       → components/
@/lib/*              → lib/
@/hooks/*            → hooks/
@/store/*            → store/
@/types/*            → types/
```

---

# Roles del sistema

Existen únicamente dos roles, definidos por la API: `SUPER_ADMIN` y `FINANZAS`.

- **No existe registro público.** No hay un flujo de `/register` que permita a alguien crearse una cuenta ni elegir su propio rol. Los usuarios se crean directamente y el rol se asigna **solo en la base de datos** — nunca desde un formulario o endpoint que el usuario controle. Si más adelante se necesita que un `SUPER_ADMIN` pueda crear usuarios desde el panel, ese flujo debe permitir *crear la cuenta*, pero el campo `role` sigue sin ser editable por quien se está registrando.
- `SUPER_ADMIN` accede a todo el panel, incluyendo administración de usuarios y configuración.
- `FINANZAS` accede únicamente a las secciones de ventas/reportes/finanzas que le correspondan — nunca a administración de usuarios ni configuración del sistema.
- Tras login, `getDashboardPath(role)` (`features/auth/utils/`) decide a dónde redirigir según el rol.
- `middleware.ts` decodifica el payload del JWT guardado en la cookie httpOnly (sin verificar firma — solo UX de redirección) y protege las rutas del panel: sin sesión → `/login`; sesión sin permiso sobre una sección → su propia vista por defecto.
- La autorización real siempre la hace `xocolatisimo-api` verificando la firma completa del JWT en cada request vía el header `Authorization`. El middleware nunca es la única barrera — es una mejora de UX, no el mecanismo de seguridad.
- Nunca confiar en el rol mostrado en el cliente para ocultar una acción sensible sin que la API también la valide — la UI oculta, la API es la que realmente autoriza.

---

# Autenticación

No se usa NextAuth. La sesión se maneja directamente contra el JWT que emite `xocolatisimo-api`:

- `POST /auth/login` devuelve el JWT dentro del envelope `{status, message, data}`. No existe `POST /auth/register` público (ver "Roles del sistema").
- `xocolatisimo-api` solo acepta el JWT vía header `Authorization: Bearer` (no cookies) — de ahí el patrón híbrido: `app/api/auth/session/route.ts` guarda el JWT en una cookie httpOnly (nunca en `localStorage`) como fuente de verdad entre recargas para que `middleware.ts` la lea en el servidor, y `store/auth-store.ts` (Zustand, sin `persist`) mantiene el token en memoria para que `lib/api/client.ts` arme el header `Authorization` en cada request del cliente.
- Al cargar la app, `useSessionHydration` (`features/auth/hooks/`) llama al route handler (GET) para leer la cookie httpOnly — el JS del navegador no puede leerla directamente — y luego `GET /auth/me` para rehidratar el usuario en el store.
- El código de recuperación de contraseña (`POST /auth/forgot-password`, `POST /auth/reset-password`) es de 6 dígitos — usar un componente de OTP (`input-otp`) para ese formulario.
- El cliente axios (`lib/api/client.ts`) adjunta el JWT automáticamente en cada request y redirige a `/login` si la API responde 401.

---

# Consumo de la API

Toda respuesta de `xocolatisimo-api` sigue este formato:

```json
{
  "status": "success",
  "message": "Operación realizada correctamente.",
  "data": {}
}
```

Errores:

```json
{
  "status": "error",
  "message": "Descripción del error."
}
```

El cliente axios debe desenvolver `data` automáticamente y propagar `message` como el mensaje de error en caso de `status: "error"` o de un status HTTP de error, para que se pueda mostrar directo en un toast/notificación.

Los endpoints de listado devuelven `PaginatedResult<T>` (`items`, `meta: { total, page, limit, totalPages }`) y aceptan `page`, `limit`, `search`, `sort` (y filtros de rango de fecha donde aplique) como query params — sincronizar estos filtros con la URL usando `nuqs`, nunca con estado local aislado (se pierde al refrescar/compartir el link).

**Odoo nunca se consume directamente desde el frontend.** El API key de Odoo vive únicamente en `xocolatisimo-api`; el panel solo habla con `xocolatisimo-api`, igual que con cualquier otro dato.

---

# Features (mapeo con los módulos de la API)

```
Auth              → login, recuperación de contraseña, perfil
Users             → panel SUPER_ADMIN: listar, ver, editar, desactivar usuarios
Ventas            → SUPER_ADMIN y FINANZAS: listados, filtros y detalle de ventas (datos que vienen de Odoo vía la API)
Reportes          → SUPER_ADMIN y FINANZAS: dashboards y gráficas (Recharts) sobre ventas/finanzas
```

---

# Formularios y validación

- Todo formulario usa `react-hook-form` + `zodResolver`.
- El esquema Zod de cada formulario debe reflejar exactamente las reglas del DTO correspondiente en la API (mismos campos, mismos límites, mismos mensajes de error en español) — evita que el usuario reciba un error 400 que la UI no anticipó.
- Los esquemas viven en `features/<feature>/schemas/`, nunca inline dentro del componente.

---

# Estándares de Código

- TypeScript estricto. Evitar `any`.
- `'use client'` solo en componentes que realmente lo necesiten (estado, efectos, listeners, hooks de React Query/Zustand). Todo lo demás se queda como Server Component.
- PascalCase para componentes y clases.
- camelCase para variables, funciones y hooks (`useSalesReport`, no `use_sales_report`).
- kebab-case para archivos y carpetas.
- UPPER_CASE para constantes.
- Un componente/hook por archivo. Aplicar Early Return.
- Preferir composición sobre herencia; nunca duplicar lógica de fetching entre features (reutilizar `lib/api/client.ts`).
- Server Actions/route handlers propios en `app/api/` solo para lo que estrictamente lo requiera (setear la cookie de auth) — el resto de la comunicación con el backend va vía React Query desde el cliente o Server Components.
- Todo debe ser Responsive.


---

# Buenas Prácticas

Aplicar siempre:

- SOLID, DRY, KISS
- Separation of Concerns entre `app/` (ruteo), `features/` (lógica + UI de dominio) y `components/` (UI genérica reutilizable)
- Alta cohesión dentro de cada feature, bajo acoplamiento entre features
- Accesibilidad: no romper roles ARIA ni el manejo de foco al construir componentes custom sobre Radix/shadcn
- Memoización solo cuando haya un problema de rendimiento medido, no por defecto

Nunca:

- Poner lógica de negocio en componentes de página — vive en `features/<feature>/api` y `hooks`
- Guardar el JWT en `localStorage`/`sessionStorage`
- Confiar únicamente en el rol del cliente para ocultar acciones sensibles
- Duplicar esquemas Zod, hooks de fetching o componentes de UI entre features
- Poner el API key de Odoo (ni ningún otro secreto) en el frontend

---

# Manejo de Errores

- Los errores de la API llegan con `status: "error"` y un `message` en español listo para mostrar — no reformatear ni traducir de nuevo.
- Manejo global de errores de mutaciones/queries vía el `QueryClient` (`onError` por defecto) más overrides puntuales cuando una mutación necesite feedback específico (ej. formulario que resalta el campo en conflicto).
- Mostrar errores con un componente de toast/notificación; nunca con `alert()`.
- 401 → redirigir a `/login` y limpiar la sesión. 403 → mostrar mensaje de permisos, no redirigir. 404 en un recurso individual → estado vacío en la vista, no un error global.

---

# Variables de Entorno

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000   # Base URL de xocolatisimo-api
```

Nunca poner secretos reales en variables `NEXT_PUBLIC_*` (son públicas en el bundle del cliente). Este frontend no debe necesitar ningún secreto propio: el API key de Odoo, credenciales de correo, etc. viven únicamente en `xocolatisimo-api`.

---

# Sistema de Diseño

## Principios de diseño

El producto es un panel administrativo interno. Toda vista nueva debe sentirse:

- Orientada a datos: los números/gráficas son el contenido principal — jerarquía visual clara para que un KPI o una tendencia se lean de un vistazo (ver skill de dataviz para gráficas).
- Minimalista y moderna: mucho espacio en blanco, tipografía como protagonista, color usado con propósito (nunca decorativo porque sí).
- Intuitiva: patrones de interacción predecibles, feedback inmediato ante cada acción, cero pasos innecesarios entre FINANZAS/SUPER_ADMIN y el reporte que buscan.
- Responsive por defecto: mobile-first, sin scroll horizontal, componentes que se reorganizan (nunca solo se "encogen") en los breakpoints `sm`, `md`, `lg`, `xl` de Tailwind.
- Accesible: contraste AA mínimo, foco visible, soporte de teclado completo, `prefers-reduced-motion` respetado (ver "Animación").

## Tokens semánticos (light / dark)

Se definen como variables CSS en `app/globals.css` (dentro de `:root`/`[data-theme="light"]` y `.dark`/`[data-theme="dark"]`) y se exponen como utilidades Tailwind (`bg-primary`, `text-foreground`, etc.) vía el bloque `@theme inline`, siguiendo la convención de shadcn/ui sobre Tailwind v4.

Estados semánticos (además de los tokens de marca que se definan):

- `destructive` → un único rojo accesible, reutilizado en claro/oscuro (aclarado en oscuro).
- `warning` → un único ámbar accesible, misma regla.
- `success` → reutiliza `primary` — no crear un verde adicional.
- `info` → color de acento secundario de la marca.

## Componentes — shadcn/ui

- Todo componente nuevo se instala vía CLI (`npx shadcn@latest add <componente>`) y vive en `components/ui/`.
- Mantener el patrón de "field" (wrapper de label + error + descripción alrededor del input) en los formularios, para que reflejen 1:1 las reglas de los DTOs de la API.

## Animación — Framer Motion

- Usar para: transición de entrada de página/sección (fade + desplazamiento leve), estados de carga/skeleton, feedback de acciones.
- No usar para: lo que Tailwind/CSS ya resuelve bien (hover simple, transición de color) — reservar Framer Motion para movimiento con propósito real.
- Duración por defecto: 150–250ms para micro-interacciones, 300–400ms para transiciones de vista. Easing `easeOut` para elementos que salen, `easeInOut` para los que entran y salen.
- Respetar siempre `prefers-reduced-motion` (Framer Motion lo soporta vía `useReducedMotion`) — ninguna animación puramente decorativa debe ignorar esta preferencia.

---

# Historial de Planes

Por cada plan aprobado y ejecutado se deberá crear un archivo Markdown dentro de:

```
plan-history/
```

Nombre:

```
YYYY-MM-DD-nombre-del-plan.md
```

Debe contener:

- Objetivo
- Cambios realizados
- Razones del cambio
- Resultado final

---

# Errores preexistentes

Cuando durante la ejecución de:

- `npm run build`
- `npm run lint`

se encuentren errores preexistentes que no pertenezcan al trabajo actual, deberán mostrarse al usuario y preguntarle si desea corregirlos o únicamente resolver los errores relacionados con la tarea actual.