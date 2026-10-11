# Registro: todos los filtros en una sola card

## Contexto
La pantalla Registro mostraba dos cards de filtros (tienda arriba; fechas, producto, tipo y exportar abajo).

## Cambios
- `InventoryLedger` acepta `leading` (controles extra al inicio de su barra); `InventoryLedgerView` le pasa el selector de tienda y deja de renderizar su propia barra (salvo mientras no hay tienda seleccionada).
