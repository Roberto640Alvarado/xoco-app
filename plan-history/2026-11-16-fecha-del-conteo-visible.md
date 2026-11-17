# Fecha del conteo visible en la pantalla de Conteo

## Objetivo

Que en Inventario → Conteo se pueda elegir la fecha y hora en que se hizo el conteo físico antes de capturar, sin tener que descubrirla en el panel de confirmación (pedido del equipo de Xocolatísimo: "agregar a qué fecha").

## Cambios realizados

- `features/inventory/components/inventory-table.tsx`
  - `CountedAtField` pasa a la barra de arriba de la tabla, a la izquierda de "Guardar cambios": "Fecha del conteo: Ahora / Otra fecha" + `datetime-local` (hasta 7 días atrás, nada en el futuro).
  - El panel "Confirmar guardado" ya no edita la fecha; solo muestra la elegida ("ahora mismo" o la fecha formateada) para confirmarla.
- `features/inventory-guide/content.ts`: nuevo paso del tour (`inv-counted-at`) para Admin/Finanzas.

## Razones del cambio

La API ya aceptaba `countedAt` (`PUT /inventory/stores/:posConfigId/items`, validado en `resolveCountedAt`), pero en el front la opción estaba escondida dentro del diálogo de confirmación y el equipo no la encontraba.

## Resultado final

Sin cambios en xoco-api. Quien captura el conteo elige primero la fecha (o deja "Ahora"), llena las cantidades y guarda; las ventas y movimientos desde esa hora se restan o suman a lo contado.
