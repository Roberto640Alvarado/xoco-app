# Submenú Inventario con pantallas separadas

## Contexto
Conteo y Registro compartían pantalla (toggle) y Movimientos era un ítem suelto del menú. Se separa todo bajo un submenú "Inventario".

## Cambios
- `app/dashboard/layout.tsx`: submenú Inventario con Conteo (`/dashboard/inventario`), Movimientos (`/dashboard/inventario/movimientos`) y Registro (`/dashboard/inventario/registro`). Roles y moduleKeys sin cambio: Conteo y Registro Admin/Finanzas (`dashboard.inventario`), Movimientos también Vendedor (`dashboard.inventario-movimientos`).
- `app/dashboard/inventario-movimientos` → `app/dashboard/inventario/movimientos` (git mv).
- Nueva página `app/dashboard/inventario/registro` + `InventoryLedgerView` (selector de tienda + `InventoryLedger`).
- `InventoryView` queda solo con Conteo (se quita el toggle Conteo/Registro).
- `module-groups.ts`: grupo "Inventario" propio en el panel de Permisos; "Otros" queda con Cierre del mes.

Sin cambios en backend ni nuevas moduleKeys.
