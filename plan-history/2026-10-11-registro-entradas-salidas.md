# Registro de entradas y salidas por tienda (frontend)

## Objetivo

Mostrar el registro con fecha y hora que expone xoco-api (`GET /inventory/stores/:posConfigId/ledger`), dentro de la pantalla de Inventario.

## Cambios realizados

- `features/inventory-ledger/` (nueva): tipos, llamada a la API, hook `useInventoryLedger` y `InventoryLedger`: tabla con fecha y hora, tipo con ícono, producto, cantidad con signo (+ verde en entradas, − en salidas, valor tal cual en conteos), estado, detalle y quién lo registró. Filtros: rango de fechas (`DateRangeFilter`, últimos 7 días por defecto), producto, tipo, y exportar a Excel.
- `inventory-view.tsx`: conmutador Conteo / Registro junto al selector de tienda. En Registro se ocultan "Actualizar inventario" y el Excel del conteo (el registro trae su propio Excel).

## Razones

Se reutiliza la pantalla y el moduleKey `dashboard.inventario` en vez de crear una página y permisos nuevos: el registro lo ven los mismos roles (Admin/Finanzas) que ya capturan el conteo.

## Resultado

`npx tsc --noEmit` y `npx eslint features/inventory features/inventory-ledger`: sin errores.
