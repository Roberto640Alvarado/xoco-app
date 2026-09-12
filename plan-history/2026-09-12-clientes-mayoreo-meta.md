# Ventas Mayoreo: resumen por cliente (Selectos / Operadora del Sur) con Meta y desglose por comprador

## Objetivo

Feedback del negocio: "¿y si se puede hacer un resumen donde se vea lo
facturado con Selectos y Operadora del Sur colocando Meta? ¿Y si también
puedo ver por sus clientes o los compradores?" — en un módulo nuevo.

Antes de construir el frontend se investigó Odoo directamente (desde
xoco-api, solo lectura) para confirmar cómo están representados estos dos
clientes — ver el detalle en el plan-history de xoco-api (mismo nombre de
archivo). Resumen: "Selectos" son ~40 sucursales de la cadena de
supermercados, todas facturando bajo una misma razón social
("Calleja S.A. de C.V." en Odoo); "Operadora del Sur" factura directo,
sin sucursales — el desglose "por comprador" nuevo refleja exactamente
eso.

## Cambios realizados

- `features/wholesale-goals/` (NUEVO), mismo diseño que
  `features/sales-goals/` ("Venta Mensual"), adaptado a cliente de
  mayoreo en vez de tienda:
  - `types/wholesale-goals.types.ts`: `WholesaleClient`,
    `WholesaleGoalSummaryItem`, `WholesaleClientGoal`,
    `UpsertWholesaleGoalsBulkPayload`, más `WholesaleBuyerTotals` /
    `WholesaleClientTotals` / `WholesaleClientTotalsReport` para el
    desglose por comprador (nuevo en xoco-api).
  - `api/wholesale-goals.api.ts`: `fetchWholesaleClients`,
    `fetchWholesaleGoalsSummary`, `upsertWholesaleGoalsBulk`,
    `fetchWholesaleClientTotals` (consume los 3 endpoints nuevos de
    xoco-api: `/wholesale-goals/clients`, `/wholesale-goals/summary`,
    `/sales/by-wholesale-client`).
  - Hooks: `use-wholesale-goals-summary.ts`,
    `use-upsert-wholesale-goals-bulk.ts`, `use-wholesale-client-totals.ts`
    (este último con `enabled` condicional — ver más abajo).
  - `components/wholesale-monthly-table.tsx`: réplica de
    `MonthlySalesTable` (mes/Meta/Alcance/Valor Pendiente por cliente de
    mayoreo en vez de por tienda), más la sección nueva "Por comprador"
    debajo.
  - `components/wholesale-goal-percent-modal.tsx`: réplica de
    `SalesGoalPercentModal` ("mismo % para todos" / "% distinto por
    cliente"), con su propio guardado — no comparte metas con Venta
    Mensual.
  - `components/wholesale-reach-chart.tsx`: réplica de `SalesReachChart`
    (barras real vs. meta por cliente).
  - `components/wholesale-buyers-table.tsx` (NUEVO, sin equivalente en
    Venta Mensual — una tienda no tiene "compradores"): un bloque de
    tabla por cliente de mayoreo, con sus compradores ordenados por
    ingresos; colapsa a 8 visibles con un "Ver los N restantes" para
    Selectos (~40 sucursales) y se ve completo de una vez para Operadora
    del Sur (1 solo comprador).
- `app/dashboard/ventas-mayoreo/page.tsx` (NUEVO).
- `app/dashboard/layout.tsx`: nuevo ítem de nav "Ventas Mayoreo" (ícono
  `Building2`), grupo `Reportes`, justo después de "Venta Mensual".

## Detalle: mismo rango de fecha en las dos secciones

El desglose "Por comprador" usa un endpoint aparte
(`/sales/by-wholesale-client`, con `dateFrom`/`dateTo` explícitos) — para
que sus totales cuadren exactamente con la tabla de Meta de arriba, se
replicó en el frontend (`actualRevenueDateRange` en
`wholesale-monthly-table.tsx`) el mismo criterio "hasta ayer" que ya usa
el backend en `WholesaleGoalsService.getSummary` para el mes en curso, en
vez de usar el `monthDateRange` genérico de `lib/month.ts` (que corta en
"hoy", no en "ayer"). En el caso borde de que hoy sea el día 1 del mes
(no hay "ayer" dentro de él todavía), la sección de comprador muestra un
aviso en vez de la tabla vacía genérica.

## Razones del cambio

- Módulo separado, no otra tabla dentro de Venta Mensual — mismo pedido
  explícito del negocio, y el desglose por comprador no tiene sentido
  para una tienda.
- Se replicó el patrón visual y de datos de `MonthlySalesTable` al pie de
  la letra (mismo modal, misma gráfica, misma tabla) en vez de diseñar
  algo nuevo — es exactamente el mismo tipo de dato (venta $ vs. meta
  encadenada), solo que agrupado por cliente de mayoreo.
- El "Por comprador" se implementó como bloques colapsables por cliente
  (no una tabla gigante mezclada) porque Selectos y Operadora del Sur
  tienen escalas MUY distintas (40 sucursales vs. 1) — mezclarlos en una
  sola tabla habría hecho ilegible el caso de Operadora del Sur.

## Resultado final

`npx tsc --noEmit` y `npm run lint` sin errores (mismo warning
preexistente de siempre en `lib/api/client.ts`, ajeno a este cambio). No
se pudo verificar visualmente — vale la pena que el usuario abra
`/dashboard/ventas-mayoreo` con `npm run dev` y confirme:

- Que los montos de Selectos y Operadora del Sur cuadran con lo que
  esperan ver facturado (los ids de Odoo se resolvieron por inspección
  directa — ver plan-history de xoco-api — pero vale la pena que el
  negocio los valide contra su propio número).
- Que la lista de compradores de Selectos (sucursales) se ve como
  esperan — el nombre viene tal cual de Odoo (`partner_id.name`), que
  incluye el prefijo "Calleja S.A. de C.V., Super Selectos ..." en
  algunos casos.
- Que el % de crecimiento por defecto (8%, precargado igual que en Venta
  Mensual) tiene sentido para mayoreo, o si prefieren dejarlo en 0%.
