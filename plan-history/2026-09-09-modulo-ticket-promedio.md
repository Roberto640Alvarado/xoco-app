# Nuevo módulo "Ticket Promedio": meta de ticket promedio por tienda

## Contexto

El usuario mandó una captura de la hoja "Ticket Promedio" del Excel original (columnas: Tienda / [Mes] / Meta / Diferencia, fila "Promedio" al final, "Diferencia" en rojo con signo "-$" cuando el real queda por debajo de la meta) y pidió un módulo nuevo, similar a Tráfico de tiendas y Venta Mensual: tabla, tarjeta y gráfica.

Confirmado por `AskUserQuestion`: el % de crecimiento es PROPIO de este módulo (mismo criterio que Venta Mensual) — no se deriva matemáticamente de Meta Venta ÷ Meta Tráfico (aunque esa relación exista), el usuario prefirió el mismo patrón de % independiente en los 3 módulos.

## Diseño

Réplica del patrón de `features/sales-goals/`, consumiendo el nuevo backend `/ticket-goals` (ver plan-history de `xoco-api`):

- `features/ticket-goals/` — `types`, `api`, `hooks` (`useTicketGoalsSummary`, `useUpsertTicketGoalsBulk`), `components`:
  - `average-ticket-table.tsx` — tabla con las columnas exactas de la captura: `[Mes]` (ticket real), Meta, Diferencia (SIN columna de Alcance % — no está en el Excel). La fila de cierre es **"Promedio"**, no "Total": a diferencia de Tráfico de tiendas/Venta Mensual (donde la fila total suma las tiendas), promediar tickets no tiene sentido sumado, así que se calcula como el promedio simple entre tiendas (`averageOrNull`, coincide con cómo lo tiene el Excel original). "Diferencia" se pinta en rojo (`text-destructive`) cuando es negativa, igual que en la captura.
  - `ticket-goal-percent-modal.tsx` — mismo modal que `GrowthPercentModal`/`SalesGoalPercentModal`, guardando contra `PUT /ticket-goals`.
  - `ticket-reach-chart.tsx` — mismo gráfico de barras agrupadas que `StoreReachChart`/`SalesReachChart` (ticket real vs. meta, en dólares).
- `app/dashboard/ticket-promedio/page.tsx` — página.
- `app/dashboard/layout.tsx` — ítem "Ticket Promedio" agregado al sidebar, después de "Venta Diaria".

La tarjeta "Cumplimiento hasta la fecha" (no pedida explícitamente para este módulo, pero sí para mantener el mismo patrón de 3 piezas — "tabla, tarjeta y gráfico" — que el usuario pidió) usa `reachPercent` (real/meta), que el backend expone aunque no aparezca como columna en la tabla.

## Verificación

- `npm run build` y `npm run lint`: limpios (mismo warning preexistente de siempre).
- Backend ya verificado por separado contra Mongo/Odoo reales (ver plan-history de `xoco-api`) — el frontend consume ese mismo endpoint sin lógica de cálculo propia, solo formatea y pinta "Diferencia" en rojo cuando es negativa.

## Pendiente

- El usuario debe revisar la UI en vivo y confirmar diseño/orden, como con los módulos anteriores.
