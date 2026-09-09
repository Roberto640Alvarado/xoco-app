# Nuevo módulo "Tráfico Diario": tráfico de órdenes día por día

## Contexto

El usuario pidió un módulo nuevo en el sidebar, "Tráfico Diario", separado de "Tráfico de tiendas" (metas), para ver el tráfico de órdenes por día. Con: filtro de mes (uno solo, "mes ancla", default mes actual) y de tienda; 3 tablas (mes ancla, mes anterior, mes ante-anterior); una gráfica "Comportamiento del tráfico [mes ante-anterior] vrs [mes anterior]" comparando esos dos meses previos; y otra gráfica con el comportamiento diario del mes ancla desglosado por cada tienda.

Aclarado por `AskUserQuestion` antes de construir: el filtro de mes es un solo selector ancla que mueve las 3 tablas y la gráfica de comparación juntos; el filtro de tienda aplica solo a tablas + gráfica de comparación (una tienda a la vez, o total si "Todas"), la gráfica "por tienda" siempre muestra todas sin importar el filtro; esa gráfica es de línea diaria (una línea por tienda); cada tabla es solo Día + Órdenes.

## Diseño

**Sin cambios en xoco-api** — todo el módulo reutiliza el endpoint `GET /sales/daily-summary` que ya existía (mismo que usa Visitas), llamado con distintos rangos de fecha:
- 3 veces (mes ancla, ancla-1, ancla-2) con el `posConfigId` del filtro de tienda (o sin él si es "Todas las tiendas") — para las 3 tablas.
- Una vez por cada tienda activa (`useStores()`), siempre sin filtro de tienda de por medio, para el mes ancla — para la gráfica "por tienda". Con ~4 tiendas esto es equivalente en costo a lo que ya hace `GoalsService.getSummary()` en el backend (varios fetches en paralelo por tienda), así que no se justificó un endpoint agregado nuevo.

**`lib/month.ts`** (nuevo, compartido): helpers puros de mes calendario (`MonthRef { year, month }`) — `previousMonthOf`, `nextMonthOf`, `isSameMonth`, `currentMonthRef`, `monthLabel` ("julio 2026", minúscula), `monthName` ("Julio", con mayúscula real para títulos), `monthDateRange` (rango YYYY-MM-01 al último día del mes, o hasta hoy si el mes es el actual). No se tocó el navegador de mes que ya tenía `TrafficGoalsTable` (duplica una lógica similar) para no arriesgar esa vista ya probada — este helper es para código nuevo.

**`features/trafico-diario/`**:
- `types/trafico-diario.types.ts` — `StoreDailySeries { store, points }`.
- `hooks/use-daily-traffic.ts` — `useDailyTraffic(anchor, posConfigId)`: calcula ancla-1 y ancla-2 con `previousMonthOf`, hace 3 `useQuery` (uno por mes) contra `/sales/daily-summary`.
- `hooks/use-daily-traffic-by-store.ts` — `useDailyTrafficByStore(monthRef)`: un fetch por tienda activa, en paralelo, para el mes dado.
- `components/daily-traffic-table.tsx` — una de las 3 tablas (Día + Órdenes + total del mes).
- `components/daily-traffic-comparison-chart.tsx` — línea doble, eje X = día del mes (1..31, no fecha real, para alinear meses de distinta duración), una línea por cada uno de los dos meses previos.
- `components/store-daily-traffic-chart.tsx` — línea múltiple (una por tienda), eje X = fecha real del mes ancla.
- `components/daily-traffic-view.tsx` — composición: toolbar (descripción + navegador de mes + selector de tienda) → grid de 3 tablas → gráfica de comparación → gráfica por tienda.
- `app/dashboard/trafico-diario/page.tsx` — página.

**`app/dashboard/layout.tsx`**: se agregó el ítem "Tráfico Diario" al sidebar, justo después de "Tráfico de tiendas" (no especificado por el usuario, orden elegido por cercanía temática — ambos módulos de "tráfico").

## Verificación

- `npm run build` y `npm run lint`: limpios (el único warning de lint es preexistente, en `lib/api/client.ts`, sin relación con este cambio).
- Verificación de la lógica de meses (wrap-around de año, corte a "hoy" en el mes en curso, orden cronológico del título de comparación) revisada a mano contra casos límite (enero → diciembre del año anterior, mes actual vs. mes cerrado). No se hizo una verificación visual en navegador en esta sesión — el patrón establecido en este proyecto hasta ahora es build/lint + revisión de datos, con el usuario revisando la UI real y reportando ajustes.

## Pendiente

- El usuario debe revisar la UI en vivo (colores, layout, si el orden de las 3 tablas o el tamaño de las gráficas necesita ajuste) y dar su visto bueno o pedir cambios, como ha sido el patrón con los módulos anteriores (Tráfico de tiendas, modal de %, etc.).
- Nada pendiente del lado del backend.
