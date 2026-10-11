# Flujo de solicitud de stock + Inventario de solo lectura para Vendedor (frontend)

## Contexto
Ver el plan homónimo en xoco-api. El negocio definió el flujo: el Vendedor solicita, Admin/Finanzas atiende desde una bandeja, el Vendedor marca recibido y Admin/Finanzas confirma (recién ahí se suma al stock). El Vendedor ve el stock y el Registro de su tienda en solo lectura.

## Cambios
- Nueva pantalla `Inventario → Solicitudes` (`/dashboard/inventario/solicitudes`, `InventoryRequestsView`):
  - Vendedor: botón "Solicitar stock" (`RequestStockDialog`) + seguimiento de sus solicitudes con el estado y qué sigue (Pendiente → En camino → Recibido → Confirmado, o Rechazado con motivo). En "Recibido" ve "en proceso de aprobación — se sumará al stock cuando Admin o Finanzas confirme".
  - Admin/Finanzas: bandeja de todas las tiendas con Aceptar (en camino), Rechazar (con motivo) y Confirmar (recepción).
- `MovementsTable`: estado `EN_CAMINO`, texto de "qué sigue" según el rol, motivo del rechazo visible, `RejectMovementDialog` (motivo obligatorio), acción Aceptar, columna Tienda opcional.
- `Movimientos` queda solo con merma/regalía/degustación (sin ENTRADA); Admin/Finanzas pueden ver "Pendientes de todas las tiendas".
- Avisos: un globo por pantalla (Movimientos y Solicitudes); contadores `{ movements, requests }`; "última visita" por pantalla.
- Vendedor: Conteo en solo lectura (`InventoryTable readOnly`, sin columna de captura ni guardar) y Registro de su tienda; ambos con la tienda bloqueada.
- Menú: Inventario → Conteo, Solicitudes, Movimientos, Registro. Permisos: etiquetas "Conteo y registro de inventario" y "Movimientos y solicitudes de inventario".
