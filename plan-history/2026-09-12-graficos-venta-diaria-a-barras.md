# Gráficos de Venta Diaria: de líneas a barras

## Objetivo

Feedback del negocio: "los gráficos comparativos de venta en tienda podrían
ser en barras" — los dos gráficos de `Venta Diaria` (features/venta-diaria)
eran de líneas.

## Cambios realizados

- `daily-sales-comparison-chart.tsx` ("Comportamiento de venta [mes] vrs
  [mes]", 2 series por día del mes): `LineChart` → `BarChart` de barras
  AGRUPADAS. Misma paleta que ya tenía (chart-2 = mes de referencia,
  chart-1 = mes reciente), mismo radio/`barGap` que `StoreReachChart`
  (features/goals/) para quedar consistente con el resto del dashboard.
- `store-daily-sales-chart.tsx` ("Comportamiento de venta por tienda", hasta
  5 series día por día del mes): `LineChart` → `BarChart` de barras
  APILADAS (no agrupadas) — con hasta 5 tiendas × ~30 días, agrupar lado a
  lado da hasta 150 barras ilegibles; apiladas muestra el total del día y
  la parte de cada tienda, que es el job real de este gráfico (ver dataviz
  skill: "parte del total" → stacked bar, no grouped).
- Sin radio en los segmentos apilados: solo el segmento que toca el borde
  superior real de la pila debería redondearse, y recharts no distingue
  eso por fila sin una forma custom — se dejó cuadrado en vez de un
  redondeo que no correspondería a un límite real del dato.

## Razones del cambio

- Se aplicó el mismo criterio de forma que ya usa `StoreReachChart` (2
  series, pocas categorías → grouped bar) en vez de reinventar un estilo
  nuevo.
- Alcance: solo se tocaron los 2 gráficos de `Venta Diaria` (los que el
  feedback nombra explícitamente, "de venta"). `Ticket Diario` y `Tráfico
  Diario` tienen el mismo patrón exacto (comparación de 2 meses +
  comparación por tienda) y quedaron igual — si el usuario quiere el mismo
  cambio ahí, es la misma receta.

## Resultado final

`npx tsc --noEmit` y `npm run lint` sin errores (mismo warning preexistente
de siempre, ajeno a este cambio). No se pudo verificar visualmente (mismo
límite de siempre: sin forma de sostener un `npm run dev` vivo desde este
puente para apuntarle un navegador aparte) — vale la pena que el usuario lo
abra y confirme que las barras apiladas de "por tienda" se leen bien con
las 5 tiendas reales.
