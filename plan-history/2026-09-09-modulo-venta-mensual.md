# Nuevo módulo "Venta Mensual": meta de venta ($) por tienda

## Contexto

El usuario mandó una captura de la hoja de venta mensual del Excel original (columnas: [Mes], Meta, Alcance, Valor Pendiente, con fila Total Mensual) y pidió replicarla en un módulo nuevo, con una tabla + tarjeta "Cumplimiento hasta la fecha" + gráfica, mismo patrón que "Tráfico de tiendas" (ver su propio plan-history y el de `xoco-api`).

Confirmado por `AskUserQuestion`: el % de crecimiento de este módulo es PROPIO — no reutiliza el que ya se configura en Tráfico de tiendas (crecer en ventas $ y crecer en visitas son metas distintas).

## Diseño

Réplica del patrón de `features/goals/`, pero en dólares y con su propio backend (`/sales-goals`, ver plan-history de `xoco-api`):

- `features/sales-goals/` — `types`, `api` (`fetchSalesGoalsSummary`, `upsertSalesGoalsBulk`), `hooks` (`useSalesGoalsSummary`, `useUpsertSalesGoalsBulk`), `components`:
  - `monthly-sales-table.tsx` — tabla más simple que `TrafficGoalsTable` (solo 4 columnas de datos: `[Mes]` con el monto real, Meta, Alcance, Valor Pendiente — sin proyección de cierre, no se pidió acá). El encabezado de la primera columna es el nombre del mes seleccionado (ej. "Julio"), calculado con el nuevo helper `lib/month.ts` (mismo que usa Tráfico Diario). Navegador de mes + botón "Configurar %" en el toolbar, igual que Tráfico de tiendas.
  - `sales-goal-percent-modal.tsx` — mismo modal que `GrowthPercentModal`, con su propio texto (aclara que es un % independiente del de Tráfico de tiendas) y guardando contra `PUT /sales-goals`.
  - `sales-reach-chart.tsx` — mismo gráfico de barras agrupadas que `StoreReachChart`, con montos en dólares (`formatCurrency`/`formatCurrencyCompact` en vez de `formatInteger`).
- `app/dashboard/venta-mensual/page.tsx` — página.
- `app/dashboard/layout.tsx` — ítem "Venta Mensual" agregado al sidebar, entre "Tráfico Diario" y "Ventas" (no especificado por el usuario, orden elegido por cercanía temática con los otros módulos de tráfico/metas).

No se compartió código de UI entre `features/goals/` y `features/sales-goals/` (cada uno con su propio modal/tabla/gráfica) — son solo ~2 usos cada patrón, y ya hay suficiente diferencia de forma (7 columnas con proyección vs. 4 columnas simples) como para que forzar un componente genérico complicara más de lo que ahorra.

## Verificación

- `npm run build` y `npm run lint`: limpios (el único warning es preexistente, sin relación).
- Backend ya verificado por separado contra Mongo/Odoo reales (ver plan-history de `xoco-api`) — el frontend consume esos mismos endpoints sin lógica de cálculo propia, solo formatea (`formatCurrency`/`formatPercent`).

## Pendiente

- El usuario debe revisar la UI en vivo y confirmar diseño/orden, como con los módulos anteriores.
