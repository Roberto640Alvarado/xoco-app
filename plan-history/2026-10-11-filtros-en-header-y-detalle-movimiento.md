# Filtros en el header, detalle de movimientos y cajas de Conteo visibles

## Pedido
- Un ícono junto al título de cada columna que abra el filtro (en vez de la fila de filtros).
- La columna "Acciones" mostraba solo "Resuelto por …": mostrar solo lo esencial y abrir un modal con el detalle al hacer clic.
- En Conteo no se notaban las cajas de existencia estimada.

## Qué se hizo
- `components/ui/data-table.tsx`: se quitó la fila de filtros; cada encabezado con filtro lleva un ícono (ListFilter) que abre un popover (texto o lista de valores), resaltado cuando hay filtro activo. Nueva prop `onRowClick` (fila clicable, también con teclado). `filtersTourId` apunta ahora al primer ícono de filtro.
- `movements-table.tsx`: columnas esenciales (Fecha, Tienda, Producto, Motivo, Cantidad, Estado) + columna "Detalle" con botón "Gestionar" (si hay acciones) o "Ver detalle". Nuevo `MovementDetailDialog` con nota, quién registró/aceptó/resolvió, cantidad recibida, motivo de rechazo y los botones de gestión (Aceptar / Confirmar / Rechazar / Marcar recibido).
- `inventory-table.tsx`: la existencia estimada ya no es un input deshabilitado (se veía casi invisible): ahora es una caja con borde y fondo, valor en negrita; el input de "Inventario nuevo" tiene borde más marcado.
- `content.ts`: textos del tour ajustados (ícono de filtro y "Gestionar").
