# Nuevo módulo "Venta Diaria": venta ($) por día

## Contexto

El usuario pidió un módulo nuevo, "Venta Diaria", explícitamente igual a "Tráfico Diario" (mismas tablas y gráficas), solo que mostrando el costo/venta en dólares en vez de la cantidad de órdenes.

## Diseño

Sin cambios en `xoco-api` — mismo endpoint `GET /sales/daily-summary` que ya trae `totalRevenue` por día (no hace falta pedir nada nuevo al backend, ya se traía ese campo, solo no se usaba en Tráfico Diario).

`features/venta-diaria/` — réplica 1:1 de la estructura de `features/trafico-diario/` (mismo diseño: filtro de mes ancla + tienda, 3 tablas mes ancla/anterior/ante-anterior, gráfica de comparación entre los dos meses previos por día-del-mes, gráfica de comportamiento diario por tienda del mes ancla), cambiando en cada pieza `orderCount` → `totalRevenue` y `formatInteger` → `formatCurrency`/`formatCurrencyCompact`:

- `hooks/use-daily-sales.ts`, `hooks/use-daily-sales-by-store.ts` — mismos hooks que Tráfico Diario, mismo `queryKey` de `/sales/daily-summary` (comparten cache con Tráfico Diario vía react-query, ya que es el mismo fetch).
- `components/daily-sales-table.tsx`, `components/daily-sales-comparison-chart.tsx`, `components/store-daily-sales-chart.tsx`, `components/daily-sales-view.tsx` — mismos componentes que Tráfico Diario, formateados en dólares.
- `app/dashboard/venta-diaria/page.tsx` — página.
- `app/dashboard/layout.tsx` — ítem "Venta Diaria" agregado al sidebar, junto a "Venta Mensual" (mismo agrupamiento que "Tráfico de tiendas" + "Tráfico Diario").

No se compartió código entre `features/trafico-diario/` y `features/venta-diaria/` (mismo criterio que con `sales-goals`/`goals`: cada módulo autocontenido) — sí se reutiliza el mismo `lib/month.ts` (helper genérico ya compartido por 3 módulos).

## Verificación

- `npm run build` y `npm run lint`: limpios (mismo warning preexistente de siempre, sin relación).
- No hubo cambios de backend que verificar — reutiliza el mismo `/sales/daily-summary` ya usado y probado por Visitas y Tráfico Diario, solo leyendo el campo `totalRevenue` que ya traía.

## Pendiente

- El usuario debe revisar la UI en vivo y confirmar diseño/orden, como con los módulos anteriores.
