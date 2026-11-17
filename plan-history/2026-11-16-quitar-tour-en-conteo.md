# Quitar el Tour guiado de Conteo

## Objetivo

Que la pantalla Inventario → Conteo ya no muestre la card "Tour guiado".

## Cambios realizados

- `features/inventory-guide/components/inventory-guide-bar.tsx`: `InventoryGuideBar` no se renderiza cuando la pantalla es Conteo (para todos los roles).
- `app/dashboard/inventario/layout.tsx`: comentario actualizado.

## Razones del cambio

Pedido del usuario. En Conteo la guía de 3 pasos (`HelpSteps` de `InventoryTable`) ya explica cómo se llena, y la card ocupaba espacio arriba de la tabla.

## Resultado final

Conteo arranca directo con el encabezado y la tabla. Solicitudes, Movimientos, Registro, Kardex, Recetas y Habilitación siguen con su Tour guiado. Los pasos del tour de Conteo siguen en `content.ts` sin usarse.
