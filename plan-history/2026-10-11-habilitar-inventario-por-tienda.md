# Habilitar Inventario por tienda (frontend)

## Contexto
Ver el plan homónimo en xoco-api. Inventario no es visible para los Vendedores hasta que el Super admin lo habilita por tienda; Admin/Finanzas lo usan siempre y deben saberlo.

## Cambios
- Administración → "Inventario por tienda" (`/dashboard/admin/inventario`, `InventoryAccessPanel`): un switch por tienda con confirmación y la recomendación de ingresar primero el stock manual (Conteo) antes de habilitar.
- `app/dashboard/inventario/layout.tsx`: envuelve todas las pantallas de Inventario. Para el Vendedor, `InventoryAccessGate` solo deja pasar si su tienda está habilitada (si no, mensaje "todavía no está habilitado"); para Admin/Finanzas, `InventoryVisibilityNotice` explica que todavía no es visible para las tiendas hasta habilitarlo (con enlace para Super admin) y recomienda cargar primero el stock.
- Menú: el submenú Inventario se oculta al Vendedor mientras su tienda no esté habilitada (`useCanUseInventory`).
- Hooks: `useInventoryAccess`, `useSetInventoryAccess`.
