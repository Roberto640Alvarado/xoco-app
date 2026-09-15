# Comparativo mensual en Ventas Mayoreo

## Objetivo

En `Mayoreo > Venta de Mayoreo`, agregar una gráfica que compare el mes seleccionado (el que se navega con las flechas de arriba) contra el mes anterior, por cliente de mayoreo (Selectos y Operadora del Sur).

## Cambios realizados

- Nuevo `features/wholesale-goals/components/wholesale-month-comparison-chart.tsx`: barras agrupadas por cliente de mayoreo, una barra para el mes seleccionado y otra para el mes anterior, con tooltip y leyenda mostrando ambos montos. Mismo patrón visual que `DailySalesComparisonChart` (features/venta-diaria/): chart-1 = mes seleccionado, chart-2 = mes de referencia.
- `features/wholesale-goals/components/wholesale-monthly-table.tsx`: además del resumen del mes navegado (`anchor`), ahora también pide el resumen del mes anterior con el mismo hook `useWholesaleGoalsSummary` (mismo endpoint `/wholesale-goals/summary` que ya alimenta la tabla) y se lo pasa a la gráfica nueva, que se ubicó debajo de "Alcance de meta por cliente de mayoreo" y arriba de "Por comprador".

## Razones del cambio

- Reusar `/wholesale-goals/summary` para ambos meses evita crear un endpoint nuevo: `actualRevenue` ya viene con la misma definición ("hasta ayer" en el mes en curso, mes completo en meses pasados) tanto para el mes seleccionado como para el anterior, así que la comparación queda consistente con el resto del módulo sin lógica adicional en el frontend.
- Seguir el patrón ya establecido de gráficas de barras agrupadas "mes actual vs. anterior" (`DailySalesComparisonChart`, `ProductMonthlyComparisonChart`) mantiene consistencia visual con el resto del panel.

## Resultado final

`npx tsc --noEmit` y `npx eslint` sobre los archivos tocados no reportan errores.
