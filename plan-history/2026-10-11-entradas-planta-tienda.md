# Entradas (envío planta→tienda): tercer tramo de Inventario (frontend)

## Objetivo

Exponer en la pantalla "Movimientos de inventario" ya existente el nuevo tipo `ENTRADA` que agrega xoco-api (ver plan-history del mismo nombre en xoco-api): el Vendedor solicita un envío de planta a tienda, lo marca como recibido con la cantidad real cuando llega, y Admin/Finanzas confirma o rechaza — reusando el mismo ledger de merma/regalía/degustación, como pidió el usuario.

## Cambios realizados

- **`features/inventory-movements/types/inventory-movement.types.ts`**: se agregó `"ENTRADA"` a `InventoryMovementType`, `"RECIBIDO"` a `InventoryMovementStatus`, y `receivedQuantity: number | null` a `InventoryMovement`.
- **`features/inventory-movements/api/inventory-movements.api.ts`**: nueva función `receiveInventoryMovement(id, receivedQuantity)` contra `PATCH /inventory/movements/:id/receive`.
- **`features/inventory-movements/hooks/use-receive-inventory-movement.ts`** (nuevo): mutación que actualiza la fila en caché — a diferencia de confirmar/rechazar, no invalida el inventario de la tienda (RECIBIDO todavía no afecta `estimatedQuantity`, solo CONFIRMADO lo hace).
- **`features/inventory-movements/schemas/create-movement.schema.ts`**: se agregó `"ENTRADA"` a las opciones válidas del campo `type`.
- **`create-movement-dialog.tsx`**: se agregó "Entrada (envío planta→tienda)" a las opciones del formulario — el texto de ayuda y el mensaje de éxito cambian cuando lo llena un Vendedor para una ENTRADA (deja claro que es una SOLICITUD, no un movimiento ya aplicado, a diferencia de merma/regalía/degustación donde el Vendedor también queda pendiente pero sin un paso de recepción después).
- **`movements-table.tsx`**: 
  - `StatusPill` ahora soporta `RECIBIDO` (azul/cielo, para distinguirlo de PENDIENTE que es ámbar).
  - La columna "Cantidad" muestra, debajo de lo solicitado, "recibido: X" cuando `receivedQuantity` ya existe — en rojo si no coincide con lo solicitado, para que el faltante salte a la vista sin tener que restar a mano.
  - Nueva acción "Marcar recibido" (ícono `ArrowDownToLine`) para cualquier fila `ENTRADA` + `PENDIENTE` — a diferencia de Confirmar/Rechazar (exclusivo de Admin/Finanzas vía `canResolve`), esta acción se ofrece a cualquiera que vea la pantalla porque el backend ya valida la pertenencia a la tienda; no hace falta duplicar esa regla en la UI.
  - Nuevo `ReceiveMovementDialog`: modal con un input de cantidad (precargado con lo solicitado, editable) en vez de un `ConfirmDialog` simple sí/no — porque este paso necesita capturar un dato, no solo confirmar una acción.
  - Confirmar/Rechazar ahora también aparecen cuando el estado es `RECIBIDO` (antes solo `PENDIENTE`) — y el texto de confirmación distingue ENTRADA ("se sumará") de los demás tipos ("se restará").

## Razones del cambio

- **Por qué "Marcar recibido" no se oculta según el rol en la UI**: a diferencia de Confirmar/Rechazar (que el backend bloquea con `@Roles(SUPER_ADMIN, FINANZAS)` sin excepción), `/receive` acepta los tres roles y el backend decide la pertenencia a la tienda con `assertOwnStoreOrThrow` — ocultarlo también en el frontend solo por rol duplicaría una regla que ya vive en el backend, con riesgo de que se desincronicen.
- **Por qué un modal aparte (`ReceiveMovementDialog`) y no reusar `ConfirmDialog`**: `ConfirmDialog` es genérico para acciones sin datos (sí/no) — acá hace falta un campo numérico (la cantidad real recibida), así que no calza sin agregarle props que `ConfirmDialog` no necesita para sus otros usos en el proyecto.
- **Por qué el input arranca con la cantidad solicitada en vez de vacío**: el caso más común es que el envío llegue completo — prellenar ahorra un tecleo en el camino feliz, y el Vendedor solo lo edita cuando de verdad hay una diferencia que reportar.

## Resultado final

`npx tsc --noEmit -p tsconfig.json`: sin errores. `npx eslint` sobre los 6 archivos nuevos/modificados: 0 errores (1 warning pre-existente en el proyecto por usar `watch()` de react-hook-form, igual al que ya tiene `create-user-modal.tsx`).
