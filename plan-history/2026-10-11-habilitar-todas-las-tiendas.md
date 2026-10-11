# Habilitar u ocultar Inventario en todas las tiendas

## Objetivo
Un botón en Administración → Inventario por tienda para habilitar u ocultar todas las tiendas de un solo clic.

## Cambios realizados
- Panel "Tiendas": botones "Habilitar todas" y "Ocultar todas" (outline), deshabilitados cuando ya están todas en ese estado. Piden confirmación; "Ocultar todas" confirma en rojo.
- Hook `useSetAllInventoryAccess`: aplica el cambio solo a las tiendas que cambian de estado, una por una (el backend maneja una tienda por llamada), y recarga el estado al final.
- Tour de la pantalla: nuevo paso "Todas a la vez".

## Resultado final
`tsc` sin errores y `eslint` solo con los avisos previos.
