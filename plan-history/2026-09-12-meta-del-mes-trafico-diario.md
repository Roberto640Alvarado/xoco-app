# Tráfico Diario: agregar Meta del mes

## Objetivo

Feedback del negocio: "En tráfico Diario se puede agregar meta del mes" —
la página `Tráfico Diario` (features/trafico-diario) mostraba el
comportamiento día a día, pero no la meta mensual de visitas/tickets, que
ya existe como dato en `features/goals` (página "Tráfico de tiendas") y
había que saltar ahí para verla.

## Cambios realizados

- `daily-traffic-view.tsx`: se agregó una fila de 3 `StatTile` ("Visitas a
  la fecha (mes ancla)", "Meta del mes", "Alcance de meta") entre la barra
  de filtros y la grilla de las 3 tablas existentes.
- Fuente del dato: `useGoalsSummary(anchor.year, anchor.month)` — el mismo
  hook que ya alimenta `TrafficGoalsTable` en `features/goals`, no se
  duplicó lógica de negocio ni se creó un endpoint nuevo.
- Si hay una tienda seleccionada en el filtro (`posConfigId`), se busca su
  `GoalSummaryItem` puntual. Si el filtro está en "Todas las tiendas", se
  suman `actualOrders` de todas las tiendas y se reutilizan los mismos
  helpers `sumOrNull`/`divideOrNull` que usa `TrafficGoalsTable` para
  `targetOrders`/`reachPercent` — mismo criterio: si falta la meta de
  CUALQUIER tienda, se muestra "—" en vez de un total que parece completo
  y no lo es.
- El cálculo vive en un solo `useMemo` (incluyendo la resolución de
  `goalItems` adentro, no afuera) para evitar el warning de
  `react-hooks/exhaustive-deps` que da una dependencia derivada con `??`
  fuera del hook.

## Razones del cambio

- Se reusó el dato y el criterio de "goals" en vez de inventar una fuente
  o fórmula nueva — la página "Tráfico de tiendas" ya resolvió exactamente
  este problema (qué hacer cuando falta una meta, cómo sumar entre
  tiendas).
- Se usó `StatTile`, el mismo componente de figura que ya usa el resto del
  dashboard para cifras puntuales (contrato `label`/`value`/`isLoading`),
  en vez de un chart nuevo — el pedido es "ver la meta del mes", un número,
  no una serie temporal.
- Alcance: solo se tocó `Tráfico Diario` (lo que pide el feedback). No se
  tocaron `Venta Diaria`/`Ticket Diario` ni la página de `Tráfico de
  tiendas` original.

## Resultado final

`npx tsc --noEmit` y `npm run lint` sin errores (mismo warning preexistente
de siempre en `lib/api/client.ts`, ajeno a este cambio). No se pudo
verificar visualmente (mismo límite de siempre: sin forma de sostener un
`npm run dev` vivo desde este puente para apuntarle un navegador aparte) —
vale la pena que el usuario lo abra y confirme que los 3 StatTile se ven
bien en la fila junto al resto de la página, tanto con una tienda
filtrada como con "Todas las tiendas".
