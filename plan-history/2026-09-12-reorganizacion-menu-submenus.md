# Reorganización del menú del sidebar en submenús por tipo de dato

## Objetivo

Quitar los encabezados de sección "General" y "Reportes" del sidebar y
reagrupar todos los reportes en submenús colapsables por tipo de dato, según
el criterio que pidió el usuario.

## Cambios realizados

- `components/layout/dashboard-shell.tsx`
  - `GROUP_ORDER` pasa de `["General", "Reportes", "Sistema"]` a `["", "Sistema"]`.
  - `NavList` ya no renderiza `SidebarGroupLabel` cuando el grupo es `""`
    (bloque principal sin título).
- `app/dashboard/layout.tsx` — nuevo `NAV_ITEMS`:
  - **Productos** (submenú): Mejores productos (`/dashboard/productos`), Categorías.
  - **Tráfico** (submenú): Visitas, Tráfico de tiendas, Tráfico diario.
  - **Ventas** (submenú): Resumen (`/dashboard`), Venta mensual, Venta diaria,
    Efectivo y otros medios.
  - **Mayoreo** (submenú): Ventas mayoreo, Buscar compradores.
  - **Tickets** (submenú): Ticket promedio, Ticket detallado.
  - **Cierre del mes**: ítem directo (no comparte tipo con ningún otro).
  - **Sistema**: Administración (solo `SUPER_ADMIN`), único grupo con encabezado.
- `lib/api/client.ts` + `app/providers.tsx` — corrección del warning
  preexistente de ESLint (`no-location-assign-relative-destination`): se
  elimina el fallback `window.location.href = "/login"` del interceptor de
  401. Ahora, si el 401 llega sin handler registrado, queda pendiente
  (`hasPendingUnauthorized`) y `setUnauthorizedHandler` lo despacha con
  `router.push` en cuanto `Providers` lo registra.

## Razones del cambio

- Los títulos "General" / "Reportes" no aportaban jerarquía real: la separación
  útil es por tipo de dato, no por "qué tan general" es la vista.
- "Categorías" es una vista de productos, así que baja como hijo de Productos.
- "Visitas" mide el tráfico de la tienda (cantidad de órdenes), por lo que
  pertenece al submenú de Tráfico y no a un ítem suelto.
- "Ventas mayoreo" y "Buscar compradores" son el mismo flujo (venta a granel y
  quién la compra), por eso forman su propio submenú "Mayoreo".
- `/dashboard` (la vista raíz del panel) se mantiene alcanzable como hijo
  "Resumen" de Ventas, porque el trigger de un submenú no es un enlace.

## Resultado final

Sidebar con un solo bloque sin encabezado (5 submenús + Cierre del mes) y la
sección "Sistema" para administración. `npm run build` compila y `npm run lint`
pasa sin errores ni warnings (el warning preexistente de `lib/api/client.ts`
quedó corregido a pedido del usuario).
