# Secciones Visitas y Productos + IVA en Ventas

## Contexto

El dashboard tenía una sola vista (Ventas) con ingresos, órdenes, ticket
promedio y el top de productos todo junto. Se pidió separar en tres
secciones con los mismos filtros (rango de fechas, tienda o "todas"):
Ventas (ahora con impuestos), Visitas (medida por cantidad de órdenes) y
Productos (top N y bottom N, cantidad ajustable).

## Diseño

### Componentes de gráfica generalizados (para reusar entre secciones)

- `components/charts/daily-trend-chart.tsx` (`DailyTrendChart`, reemplaza a
  `SalesTrendChart`) — mismo `AreaChart` de antes, ahora parametrizado por
  `metricKey: "totalRevenue" | "orderCount" | "totalTax"` — Ventas y
  Visitas comparten la misma serie de `/sales/daily-summary`, solo cambia
  qué campo se grafica.
- `components/charts/product-ranking-chart.tsx` (`ProductRankingChart`,
  reemplaza a `TopProductsChart`) — no reordena su propio `data`: dibuja lo
  que recibe, así sirve tanto para "más vendidos" (`order=desc`) como
  "menos vendidos" (`order=asc`). Gana `headerExtra?: ReactNode` para poder
  meter el input de cantidad junto al subtítulo sin anidar otra tarjeta
  encima (ver nota de diseño más abajo).
- `components/ui/stat-tile.tsx` (`StatTile`, reemplaza a `SalesStatTiles`) —
  un tile genérico de `label`/`value`, cada página compone los que necesita
  en vez de tener un set de 3 fijo.

### `app/dashboard/page.tsx` (Ventas)

- Se quitó el top de productos de esta página (se movió a Productos).
- Tiles: Ingresos totales, Impuestos (IVA) — de `totalTax` —, Ingresos
  netos (ingresos - IVA) y Venta promedio (ingresos / órdenes del rango).
- Gráfica: `DailyTrendChart` con `metricKey="totalRevenue"`.

### `app/dashboard/visitas/page.tsx` (nueva)

- Visitas se mide por cantidad de órdenes de la tienda, reutilizando la
  misma serie de `/sales/daily-summary` (no hay un endpoint de "visitas"
  separado — el pedido fue explícito en que la métrica es el conteo de
  órdenes).
- Tiles: Visitas totales, Órdenes promedio por día.
- Gráfica: `DailyTrendChart` con `metricKey="orderCount"`.

### `app/dashboard/productos/page.tsx` (nueva)

- Dos `ProductRankingChart`: "Productos más vendidos" (`useProductRanking`
  con `order="desc"`) y "Productos menos vendidos" (`order="asc"`).
- Cada una con su propio input numérico de cantidad (`LimitInput`, 1-50,
  default 10) en el header de la tarjeta vía `headerExtra` — cambiar el
  número dispara un nuevo fetch (react-query cachea por `[filters, limit,
  order]`, así que volver a un valor ya visto no vuelve a pedirlo).

### Navegación

`app/dashboard/layout.tsx` — `NAV_ITEMS` gana "Visitas" y "Productos"
(visibles para ambos roles, igual que "Ventas" — sin restricción de rol).

### Bug de resaltado de nav corregido de paso

Con solo dos rutas (`/dashboard` y `/dashboard/admin`) el match de
"¿cuál item está activo?" en `dashboard-shell.tsx` ya tenía un bug latente:
usaba `pathname.startsWith(item.href + "/")`, y como "Ventas" es
`/dashboard`, cualquier ruta hija (`/dashboard/admin`, y ahora también
`/dashboard/visitas` y `/dashboard/productos`) hacía match con "Ventas"
*primero* simplemente por venir antes en el arreglo — nunca se resaltaba
"Administración" correctamente, y con las dos rutas nuevas el problema se
iba a notar mucho más (Visitas/Productos siempre hubieran mostrado
"Ventas" resaltado). Se corrigió con `findActiveNavItem()`: en vez de tomar
el primer match del arreglo, toma el match cuyo `href` sea más específico
(el más largo) — así cada ruta resalta su propio item sin importar el
orden en `NAV_ITEMS`. Mismo fix aplicado al título de la topbar.

## Verificación

- `npm run build` (Turbopack + TypeScript) — 0 errores, las 4 rutas de
  `/dashboard/*` compilan y generan como estáticas.
- `npm run lint` — 0 errores. Se corrigieron en el camino:
  - Un `react-hooks/static-components` real en `daily-trend-chart.tsx`
    (heredado de la generalización de esta misma sesión): el tooltip se
    armaba con una factory (`makeTooltip(metricKey, formatValue)`) que
    devolvía un componente nuevo en cada render. Se movió el tooltip a un
    componente de módulo (`TrendTooltip`) que recibe `metricKey`/
    `formatValue` como props normales — recharts clona el elemento
    inyectándole `active`/`payload`, así que no hace falta closure.
  - Dos warnings de `react-hooks/exhaustive-deps` (Ventas y Visitas): el
    `useMemo` de los totales dependía de `data` (un `dailySummary.data ?? []`
    con identidad nueva en cada render); se movió el `?? []` adentro del
    `useMemo` y la dependencia pasó a ser `dailySummary.data` directamente.
- Backend (`xoco-api`): `npm run build` / `npm run lint` — 0 errores,
  arranque limpio del servidor real (sin el error de Observe de antes).
  La conexión a MongoDB Atlas que había fallado antes en esta sesión ya se
  recuperó (confirmado con un intento de login real que llegó hasta la
  base de datos).
- Verificación visual en vivo con datos reales: pendiente — no se contaba
  con la contraseña del `SUPER_ADMIN` sembrado en esta sesión. Vale la pena
  correr `npm run dev` (puerto 3010) y revisar las 3 secciones con el ojo
  puesto en: que el IVA de Ventas sume razonable contra el ingreso bruto,
  que Visitas coincida con la cantidad de órdenes, y que el bottom-N de
  Productos realmente muestre los menos vendidos (no una repetición del
  top).

## Pendiente

- Confirmar en vivo (con login real) los tres puntos de la sección anterior.
- Sigue sin existir un usuario `FINANZAS` para probar el flujo completo con
  ese rol (Visitas/Productos/Ventas visibles, Administración bloqueada).
