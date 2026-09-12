# Top productos por categoría (módulo nuevo)

## Objetivo

Feedback del negocio: "Y si se puede colocar el producto top 10 por
categoría" — con la observación de que debía ir en otro módulo, porque
`Productos` ya se estaba llenando (5 gráficos: comparación mensual, más/
menos vendidos por unidades, más/menos vendidos a granel por Kg).

Ambigüedades resueltas con el usuario antes de implementar
(AskUserQuestion):
- Métrica: **por ingresos ($)**, no por unidades — así conviven productos
  por pieza y a granel (ej. "Crocks") en el mismo ranking de su
  categoría, sin repetir el problema que se resolvió en `Productos`.
- Layout: **todas las categorías en una sola página**, cada una con su
  propio top 10, en vez de un selector de categoría + una vista a la vez.

## Cambios realizados

- `features/sales/types/sales.types.ts`: `CategoryProduct { productId,
  productName, revenue }`, `CategoryTopProducts { categoryId,
  categoryName, products }`.
- `features/sales/api/sales.api.ts`: `fetchProductRankingByCategory()`
  (consume `GET /sales/top-products-by-category`, nuevo en xoco-api — ver
  su propio plan-history).
- `features/sales/hooks/use-product-ranking-by-category.ts` (NUEVO).
- `components/charts/category-top-products-chart.tsx` (NUEVO): mismo
  patrón visual que `ProductRankingChart`/`ProductWeightRankingChart`
  (barra horizontal, un solo color, tabla "Ver tabla" de respaldo), pero
  `dataKey="revenue"` con `formatCurrency` en vez de unidades o Kg.
- `app/dashboard/categorias/page.tsx` (NUEVO): mismo `SalesFiltersBar`
  (fecha + tienda) que el resto de reportes, un input "Mostrar N por
  categoría", y un `CategoryTopProductsChart` por cada categoría que
  devuelve el backend — ya vienen ordenadas por venta total, así que la
  página solo las recorre en el orden que recibe.
- `app/dashboard/layout.tsx`: nuevo ítem de nav "Categorías" (ícono
  `Tags` de `lucide-react`), grupo `General`, justo después de
  "Productos".

## Razones del cambio

- Módulo separado (no otro gráfico más en `Productos`) porque el mismo
  feedback lo pidió explícitamente — coincide con lo que ya se veía en
  `productos/page.tsx`: 5 bloques de gráfico antes de agregar este.
- Se reutilizó el mismo componente de filtros (`SalesFiltersBar`) y el
  mismo lenguaje visual de gráfico de barras horizontal que ya usa
  `Productos`, en vez de inventar un estilo nuevo para el módulo nuevo.
- "Todas las categorías en una página" (en vez de selector) se eligió
  para poder comparar categorías de un vistazo sin clics — el usuario lo
  confirmó como la opción recomendada.

## Resultado final

`npx tsc --noEmit` y `npm run lint` sin errores (mismo warning
preexistente de siempre en `lib/api/client.ts`, ajeno a este cambio). No
se pudo verificar visualmente (mismo límite de siempre) — vale la pena
que el usuario abra `/dashboard/categorias` con `npm run dev` y confirme:

- Que el nombre y la cantidad de categorías de Odoo se ven como espera
  (el nombre viene de `product.category.name`, no de `complete_name` —
  una categoría con padre no muestra la jerarquía completa).
- Que la página no queda demasiado larga si Odoo tiene muchas categorías
  — si son muchas, puede valer la pena reconsiderar el layout (selector
  de categoría) que se descartó en favor de "todas en una página".
