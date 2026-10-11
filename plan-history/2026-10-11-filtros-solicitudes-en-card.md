# Filtros de Solicitudes en la card y fuera el aviso de visibilidad

## Objetivo
Poner los filtros de fecha y tienda (y los que hagan falta) en la card de Solicitudes, sin filtros en el encabezado de la tabla, y quitar la card "Visible en X tiendas".

## Cambios realizados
- Solicitudes: la card ahora tiene rango de fechas, tienda y estado (el Vendedor: fechas y estado, con su tienda fija, más "Solicitar stock"). Filtrado del lado del cliente; por defecto el rango es lo que va del año para no esconder solicitudes abiertas antiguas. Admin/Finanzas filtran por Pendiente, En camino o Recibido; el Vendedor ve además Confirmado y Rechazado.
- `DataTable` y `MovementsTable` reciben `columnFilters` (por defecto true); Solicitudes lo apaga, así que el encabezado de la tabla ya no lleva íconos de filtro.
- Se eliminó `InventoryVisibilityNotice` (la card de visibilidad) del layout de Inventario y su paso del tour; el estado por tienda sigue en Administración → Inventario.
- Tour de Solicitudes: nuevo paso "Filtros" (ancla `req-filters`).

## Resultado final
`tsc` y `eslint` sin errores nuevos.
