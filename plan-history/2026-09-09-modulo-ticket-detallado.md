# Nuevo módulo "Ticket Detallado": ticket promedio ($) por día

## Contexto

El usuario pidió un módulo nuevo, "Ticket Detallado", explícitamente con la misma lógica que Tráfico Diario y Venta Diaria (mismas tablas y gráficas), mostrando el ticket promedio (lo de "Ticket Promedio") en vez de la cantidad de órdenes o la venta sola.

## Diseño

Sin cambios en `xoco-api` — mismo endpoint `GET /sales/daily-summary` (ya trae `orderCount` y `totalRevenue` por día); el ticket promedio se deriva en el frontend como `totalRevenue / orderCount`.

`features/ticket-diario/` — réplica de la estructura de `features/trafico-diario/`/`features/venta-diaria/` (mismo diseño: filtro de mes ancla + tienda, 3 tablas mes ancla/anterior/ante-anterior, gráfica de comparación entre los dos meses previos por día-del-mes, gráfica de comportamiento diario por tienda), pero cada pieza deriva el ticket promedio en vez de leer un campo directo:

- `types/ticket-diario.types.ts` — `averageTicketOf(point)` = `totalRevenue/orderCount`, o `null` si el día no tuvo órdenes (nunca "$0", que insinuaría que sí hubo venta con ticket cero).
- `hooks/use-daily-ticket.ts`, `hooks/use-daily-ticket-by-store.ts` — mismos hooks (mismo `queryKey` de `/sales/daily-summary`, comparten cache con Tráfico Diario/Venta Diaria vía react-query).
- `components/daily-ticket-table.tsx` — cada fila usa `averageTicketOf` (o "—" si el día no tuvo órdenes); el resumen del encabezado ya no es un simple total sino el ticket promedio "blended" de todo el período (venta total del rango / órdenes totales del rango, no el promedio de los promedios diarios).
- `components/daily-ticket-comparison-chart.tsx`, `components/store-daily-ticket-chart.tsx` — mismas gráficas, con `connectNulls` en las líneas (un día sin órdenes no corta la línea, mismo criterio que "—" en la tabla).
- `components/daily-ticket-view.tsx` — misma composición; título de la gráfica de comparación: "Comportamiento del ticket promedio [mes ante-anterior] vrs [mes anterior]".
- `app/dashboard/ticket-detallado/page.tsx` — página.
- `app/dashboard/layout.tsx` — ítem "Ticket Detallado" agregado al sidebar, junto a "Ticket Promedio" (mismo agrupamiento que los pares Tráfico/Venta).

No se compartió código entre este módulo y Tráfico Diario/Venta Diaria (mismo criterio de autocontención que el resto de la familia de módulos de tráfico/venta/ticket) — sí se reutiliza `lib/month.ts` (helper genérico ya compartido por los demás).

## Verificación

- `npm run build` y `npm run lint`: limpios (mismo warning preexistente de siempre, sin relación).
- No hubo cambios de backend que verificar — reutiliza el mismo `/sales/daily-summary` ya usado y probado, solo derivando la razón venta/órdenes en el cliente.

## Pendiente

- El usuario debe revisar la UI en vivo y confirmar diseño/orden, como con los módulos anteriores.
