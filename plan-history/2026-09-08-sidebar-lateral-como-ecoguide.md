# Sidebar lateral deslizable (mismo diseño de ecoguide-app)

## Contexto

Pediste copiar el mismo menú lateral deslizable ("slider menu") que usa
`ecoguide-app`. Ese sidebar es el bloque `sidebar` de shadcn/ui
(`components/ui/sidebar.tsx`, ~700 líneas): en móvil se renderiza como un
`Sheet` (drawer que se desliza desde el borde), en escritorio como panel
fijo colapsable a modo ícono, con `SidebarProvider` manejando todo el
estado. `ecoguide-app` lo envuelve en un `DashboardShell` propio
(`components/layout/dashboard-shell.tsx` + `teacher-sidebar.tsx`/
`student-sidebar.tsx` con la lista de nav por rol).

Se replicó esa misma estructura, adaptada a que `xoco-app` usa `@base-ui/react`
como primitiva (estilo `base-vega` de shadcn) en vez de Radix — el bloque
`sidebar` que trae el propio CLI de shadcn para este proyecto ya viene en esa
variante (mismos nombres de componente: `Sidebar`, `SidebarProvider`,
`SidebarMenuButton`, etc. — API idéntica a la de ecoguide, cambia la
implementación interna).

## Qué se instaló / creó

- `npx shadcn add sidebar separator avatar` → `components/ui/{sidebar,sheet,tooltip,skeleton,separator,avatar}.tsx` + `hooks/use-mobile.ts`.
- `components/ui/user-avatar.tsx` (nuevo) — iniciales únicamente (el `User`
  de `xoco-api` no tiene foto de perfil, a diferencia de ecoguide).
- `components/layout/theme-toggle.tsx` (nuevo) — copiado de ecoguide, sobre
  `next-themes` (ya era dependencia declarada pero no estaba cableada:
  se agregó `ThemeProvider` en `app/providers.tsx`, junto con
  `TooltipProvider` que el propio sidebar necesita para los tooltips del
  modo colapsado a ícono).
- `components/layout/dashboard-shell.tsx` (nuevo) — mismo patrón que el de
  ecoguide: header con marca + logo (ícono `Store` en vez del PNG de
  ecoguide, Xocolatísimo no tiene uno), nav animado con `framer-motion`
  (fade + slide de cada ítem al montar), footer con avatar + email + badge
  de rol + toggle de tema + botón de salir, `SidebarRail` para
  redimensionar arrastrando el borde. También copié el gate de
  `isHydrated` (spinner de carga hasta que `useSessionHydration` termina) —
  evita que las páginas hijas disparen fetches sin el token todavía puesto.
  Simplifiqué una cosa a propósito: en vez del `PageTitleProvider`/
  `PageHeader` de ecoguide (context para que cada página anuncie su
  título), el topbar aquí solo busca en `navItems` cuál coincide con la
  ruta activa y muestra esa label — alcanza con las 3 páginas que hay hoy,
  se puede migrar al patrón de context si el panel crece mucho más.
- `NAV_ITEMS` con permisos por rol (campo `roles?` en `DashboardNavItem`):
  "Ventas" para cualquiera, "Administración" solo si `role === "SUPER_ADMIN"`
  — reemplaza la barra de nav simple que había en `app/dashboard/layout.tsx`.
- Limpieza: `app/dashboard/page.tsx` y `app/dashboard/admin/page.tsx` ya no
  repiten su propio `<h1>` con el nombre de la sección — ahora lo muestra el
  topbar del shell (mismo criterio que ecoguide).

## Errores encontrados y arreglados en el camino

- **`asChild` no existe en esta variante de `SidebarMenuButton`**: el bloque
  `base-vega` de shadcn usa el patrón `render` de `@base-ui/react` (`render={<Link href="..." />}` en vez de `asChild` + `<Link>` como children) — es el
  equivalente al `asChild` de Radix pero con otra API. Corregido en
  `NavList`.
- **"Functions cannot be passed directly to Client Components"** al buildear
  `/dashboard`: `app/dashboard/layout.tsx` no tenía `"use client"`, así que
  Next lo trataba como Server Component — y estaba armando `NAV_ITEMS` con
  referencias a componentes de ícono (`LayoutDashboard`, `Settings`) y
  pasándolas como prop a `DashboardShell` (client component). Un ícono
  (función) no es serializable cruzando ese límite server→client. Arreglado
  agregando `"use client"` al layout — mismo patrón que ecoguide, donde
  `TeacherSidebar`/`StudentSidebar` (quienes arman `navItems` con íconos)
  son client components desde el inicio.
- **`hooks/use-mobile.ts` (generado por el propio CLI de shadcn) fallaba el
  lint** (`react-hooks/set-state-in-effect`: llamaba `setIsMobile(...)`
  síncrono dentro de un efecto). Reescrito con `useSyncExternalStore` en vez
  de `useState` + `useEffect` — mismo comportamiento, sin el patrón que
  marca el linter, y es la forma más idiomática de suscribirse a
  `matchMedia` de todos modos.

## Verificación

`npm run build` y `npm run lint` — 0 errores/warnings nuevos (el único
warning sigue siendo el preexistente e intencional del interceptor de
axios). Con ambos servidores reales corriendo y sesión de `SUPER_ADMIN`:
`/dashboard`, `/dashboard/admin` y `/dashboard/admin/odoo` → 200, sin
errores en el log SSR.

**No pude verificar visualmente** el comportamiento del sidebar en sí
(colapsar a modo ícono, el drawer deslizable en móvil, los tooltips) — el
puente remoto a tu Mac no deja mantener un servidor vivo entre llamadas
separadas para apuntarle un navegador aparte, y el contenido del sidebar
además solo se pinta tras la hidratación del lado del cliente (curl no
ejecuta ese JS). Vale la pena que lo abras tú con `npm run dev` y confirmes
que se ve/comporta como esperabas — sobre todo el colapso a ícono y el
drawer en una ventana angosta.
