# Buscador de compradores + Efectivo y otros medios (frontend)

## Objetivo

Dos módulos nuevos pedidos por el negocio (ver la entrada gemela en
`xoco-api`, que documenta la investigación en Odoo): un buscador general
de compradores, y un desglose de venta por método de pago (Efectivo vs.
otros medios) filtrable por tienda y fecha.

## Módulo A — `/dashboard/buscar-compradores`

- `features/sales/types/sales.types.ts`: `CustomerSearchResult`,
  `CustomerSearchFilters`.
- `features/sales/api/sales.api.ts`: `fetchCustomerSearch()` →
  `GET /sales/customers/search`.
- `features/sales/hooks/use-customer-search.ts` (nuevo): hace debounce
  del texto de búsqueda (350ms) antes de disparar el request — sin esto,
  cada tecla dispara un `read_group` nuevo contra Odoo. La query queda
  deshabilitada (`enabled`) mientras el texto tenga menos de 2
  caracteres, igual que exige el DTO del backend.
- `app/dashboard/buscar-compradores/page.tsx` (nuevo): input de búsqueda
  con ícono + rango de fechas (sin filtro de tienda: el buscador usa
  facturas, que no tienen tienda propia — ver la entrada de `xoco-api`) +
  tabla de resultados (comprador, empresa matriz si aplica, facturas,
  ingresos), ordenados por venta descendente. Estados: hint de "escribe
  al menos 2 caracteres", loading (skeleton), sin resultados.

## Módulo B — `/dashboard/efectivo-otros-medios`

- `features/sales/types/sales.types.ts`: `PaymentMethodBucket`,
  `PaymentMethodTotals`, `PaymentMethodsSummary`.
- `features/sales/api/sales.api.ts`: `fetchPaymentMethodsSummary()` →
  `GET /sales/payment-methods`.
- `features/sales/hooks/use-payment-methods-summary.ts` (nuevo).
- `app/dashboard/efectivo-otros-medios/page.tsx` (nuevo): reutiliza
  `SalesFiltersBar` (mismo componente de tienda + rango de fechas que
  Productos/Categorías) — así el módulo sí filtra por tienda y fechas,
  como pidió el feedback. 3 `StatTile` (Efectivo, Otros medios, Total) +
  tabla de detalle por método de pago (nombre, tipo, cantidad de pagos,
  monto), debajo de los totales.

## Navegación

`app/dashboard/layout.tsx`: "Buscar compradores" (ícono `Search`, grupo
General, junto a "Visitas") y "Efectivo y otros medios" (ícono `Wallet`,
grupo Reportes, junto a "Ventas Mayoreo").

## Razones del cambio

- Buscador como módulo aparte en "General" (no una pestaña de Ventas
  Mayoreo): el negocio lo pidió explícitamente como "otro módulo", y a
  diferencia de Ventas Mayoreo no está limitado a los 2 clientes fijos.
- Efectivo y otros medios reutiliza `SalesFiltersBar` en vez de armar
  filtros nuevos, para que el filtro de tienda se comporte exactamente
  igual que en el resto del dashboard (mismo componente, mismo behavior).
- Debounce del buscador implementado a mano (no existía un hook
  reutilizable de debounce en el repo) — queda como
  `use-customer-search.ts`, se puede extraer a un hook genérico si otro
  módulo lo necesita más adelante.

## Verificación

- `npx tsc --noEmit`: limpio. (El chequeo aislado requirió correr
  `npx next typegen` antes de `tsc` — sin eso, `tsc` no encuentra el tipo
  `LayoutProps` que Next.js genera para `app/layout.tsx`; no es un error
  de este cambio, es parte del setup del chequeo aislado fuera de
  `npm run dev`.)
- `npm run lint`: sin errores (mismo warning preexistente de siempre en
  `lib/api/client.ts` sobre `window.location.href`, ajeno a este
  cambio).
- No se pudo verificar visualmente (mismo límite de siempre) — vale la
  pena que el usuario abra ambas páginas con `npm run dev` y confirme:
  - Que el buscador encuentra tanto sucursales de Selectos como clientes
    individuales, y que "empresa matriz" solo se muestra cuando es
    distinta del comprador.
  - Que el Efectivo total de una tienda/fecha conocida cuadra contra el
    cierre de caja que ya manejan, y que el filtro de tienda realmente
    cambia los números (los pagos se resuelven vía las órdenes de esa
    tienda, no tienen tienda propia en Odoo).

## Iteración: detalle de "otros medios" + gráfica

Feedback tras ver la tabla en producción: la columna "Tipo" colapsaba
métodos muy distintos (CUSCATLAN, Tarjeta, PAYWAY, Transferencias
bancarias, Pedidos YA, Cuenta de cliente, DAVIVIENDA) al mismo texto
genérico "Otro medio" — pidió detallarlo (usando el dato que ya
tuviéramos) y mostrarlo también en gráfica.

- `features/sales/utils/payment-method-type.ts` (nuevo): traduce
  `pos.payment.method.type` de Odoo (el dato que ya trae cada fila del
  backend, antes descartado al binario Efectivo/Otro medio) a una
  etiqueta más específica: `cash` → "Efectivo", `bank` → "Tarjeta /
  transferencia", `pay_later` → "Cuenta de cliente", `pay_now` → "Pago en
  línea" (no se vio en los datos reales pero es un type estándar de
  Odoo), cualquier otro type → "Otro". Cada etiqueta lleva su color
  (`--color-chart-1..5`) para que tabla y gráfica usen exactamente la
  misma clasificación — no se puede detallar más allá de esto sin
  fabricar una categorización que Odoo no expone (dentro de `bank` caen
  por igual tarjeta, transferencia y apps de delivery; el propio nombre
  del método, ya visible en la tabla y la gráfica, es lo más granular
  que hay).
- `components/charts/payment-methods-chart.tsx` (nuevo): barra
  horizontal, un método por fila (mismo lenguaje visual que
  `CategoryTopProductsChart`), coloreada por `type` vía
  `payment-method-type.ts`, con una leyenda arriba que solo lista los
  tipos presentes en los datos del rango. El tooltip muestra método +
  tipo + monto.
- `app/dashboard/efectivo-otros-medios/page.tsx`: se insertó
  `PaymentMethodsChart` entre los 3 `StatTile` y la tabla de detalle; la
  columna "Tipo" de la tabla ahora usa `paymentMethodTypeMeta()` en vez
  del `method.type === "cash" ? ... : "Otro medio"` original.

No hubo cambios de backend — `PaymentMethodTotals.type` ya traía el dato
crudo de Odoo, solo no se estaba usando en el frontend.

### Verificación

- `npx next typegen && npx tsc --noEmit`: limpio.
- `npm run lint`: sin errores (mismo warning preexistente de siempre en
  `lib/api/client.ts`, ajeno a este cambio).
