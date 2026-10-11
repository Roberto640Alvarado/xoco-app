# Inventario: se quita la columna "Índice inicial (Odoo)" (frontend)

## Objetivo

Acompaña el cambio de xoco-api del mismo nombre: el índice de Odoo salía negativo en casi todo, así que se quita.

## Cambios realizados

- `inventory-table.tsx`: la columna "Índice inicial (Odoo)" (escritorio y tarjeta móvil) pasa a "Existencia estimada", mostrando `estimatedQuantity` (conteo − ventas ± movimientos confirmados) en la misma caja gris de solo lectura; "—" si el producto nunca se contó. Antes `estimatedQuantity` llegaba de la API pero no se mostraba en ningún lado.
- `inventory-view.tsx`: textos del banner y del toolbar, y columna del Excel exportado ("Existencia estimada" en vez de "Índice inicial (Odoo)").
- `inventory.types.ts`: se quita `odooQuantity` de `InventoryItem` (este archivo traía además el cambio previo de `estimatedQuantity`, que ahora queda commiteado).

## Razones

Se reemplaza por la existencia estimada en vez de dejar un hueco: es el número que de verdad cambia al registrar ventas, mermas, regalías, degustaciones y entradas, y sin mostrarlo esos movimientos no tenían efecto visible en esta pantalla.

## Resultado

`npx tsc --noEmit` y `npx eslint features/inventory`: sin errores.
