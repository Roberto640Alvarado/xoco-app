# Ranking de productos a granel (Kg) y comparación mensual

## Objetivo

Mejorar el análisis por producto del dashboard: (1) un gráfico que compare,
por producto, el mes en curso contra el mes anterior, y (2) sacar del
ranking de "más vendidos" a los productos que se venden por peso (ej.
"Crocks"), que salían como best-seller solo por venir en gramos.

## Cambios realizados

- Tipos nuevos en `features/sales/types/sales.types.ts`: `TopProductByWeight`,
  `ProductMonthPeriod`, `ProductMonthlyComparison`.
- `features/sales/api/sales.api.ts`: `fetchProductRankingByWeight` (consume
  `/sales/top-products-by-weight`) y `fetchProductMonthlyComparison`
  (consume `/sales/product-monthly-comparison`, sin rango de fechas — el
  backend siempre compara mes en curso vs. mes anterior completo).
- Hooks nuevos: `use-product-ranking-by-weight.ts`,
  `use-product-monthly-comparison.ts`.
- `components/charts/product-weight-ranking-chart.tsx`: mismo patrón que
  `ProductRankingChart`, pero por Kg (`formatKg`) en vez de unidades.
- `components/charts/product-monthly-comparison-chart.tsx`: por producto,
  dos barras horizontales — mes en curso arriba (acento, `--color-chart-1`)
  y mes anterior abajo (gris neutro, `--color-chart-2`), con leyenda y
  tooltip propios (texto en tinta neutra, el color solo en el punto — ver
  skill de dataviz).
- `lib/format.ts`: `formatKg`, `formatMonthLabel`.
- `app/dashboard/productos/page.tsx`: agrega la comparación mensual arriba
  de los rankings existentes, y dos nuevas secciones "Productos a granel
  (más/menos vendidos)" por Kg al final.

## Razones del cambio

- Decisiones de producto confirmadas con el usuario antes de implementar:
  el mes anterior se compara COMPLETO (no recortado al mismo día que el mes
  en curso), y los productos a granel van en un ranking APARTE por Kg — no
  mezclados con el resto convertido a Kg.
- Los dos colores de la comparación mensual (acento vs. gris) siguen el
  mismo par que ya usa el resto del dashboard para "actual vs. anterior",
  sin introducir una paleta nueva.

## Resultado final

`npx tsc --noEmit` y `npm run lint` sin errores (1 warning preexistente en
`lib/api/client.ts`, ajeno a este cambio — pendiente de confirmar con el
usuario si se corrige). `npm run build` no se pudo correr en este entorno
(permiso de borrado sobre `.next/` del contenedor de desarrollo), así que la
verificación de build de producción queda pendiente de que el usuario la
corra localmente.
