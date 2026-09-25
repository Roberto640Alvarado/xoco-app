# Fix: comparativo de "Tráfico Diario" comparaba los dos meses anteriores, no el mes seleccionado

## Objetivo

En el módulo "Tráfico Diario", la gráfica "Comportamiento del tráfico X vrs Y" debe comparar el mes seleccionado (mes ancla del filtro) contra el mes inmediatamente anterior. Reportado por el usuario: estando en septiembre, la gráfica mostraba "Julio vrs Agosto" en vez de "Agosto vrs Septiembre".

## Cambios realizados

- `features/trafico-diario/components/daily-traffic-view.tsx`: la gráfica de comparación (`DailyTrafficComparisonChart`) ahora recibe `traffic.prev1` (mes anterior) como serie "older" y `traffic.anchor` (mes seleccionado) como serie "recent", en vez de `traffic.prev2`/`traffic.prev1`. `comparisonTitle` se ajustó igual (`prev1 vrs anchor`).
- `features/trafico-diario/components/daily-traffic-comparison-chart.tsx`: actualizado el comentario del componente para reflejar que compara el mes ancla contra el mes anterior, no los dos meses previos al ancla.
- Las 3 tablas (ancla / ancla-1 / ancla-2) y la gráfica "por tienda" no cambiaron — siguen igual que antes.

## Razones del cambio

- El diseño original (ver `plan-history/2026-09-09-modulo-trafico-diario.md`) fue aclarado explícitamente con el usuario como "ancla-1 vs ancla-2" antes de construirse. El feedback real del negocio corrige esa decisión: lo útil es comparar el mes que se está viendo contra el inmediato anterior (el uso normal de "cómo vamos este mes vs. el pasado"), no dos meses ya cerrados que no incluyen el mes en curso.
- Se mantiene `traffic.prev2` sin tocar porque la tercera tabla (mes ante-anterior) sigue siendo parte del diseño acordado; solo la gráfica cambió de rango.

## Resultado final

`npx tsc --noEmit` y `npx eslint` sobre los 2 archivos tocados: sin errores.
