# Exportar a Excel respeta filtros y trae todas las páginas

## Objetivo
Que todo botón "Exportar" descargue exactamente lo que el usuario filtró en pantalla y, si el listado tiene paginación, todas las páginas (no solo la visible).

## Cambios realizados
- `components/ui/export-excel-button.tsx`: `sheets` acepta una función async; muestra "Reintentar" con el mensaje de error si falla.
- `design-system/components/data-table.tsx`: nueva prop `onFilteredRowsChange` con las filas filtradas (todas las páginas).
- Órdenes (`features/pos-tickets`): `fetchAllPosTickets` recorre todas las páginas (100 por llamada) con rango, tienda, búsqueda y orden de la pantalla. El botón pasa de "Exportar página" a "Exportar".
- Kardex: Excel y PDF usan los productos visibles (filtro de movimiento, categoría y búsqueda).
- Registro de inventario, Conteo (inventario) y Comparación de productos: exportan las filas que quedan tras la búsqueda y los filtros de columna de la tabla.
- `design-system/README.md`: documentada la regla.

## Razones del cambio
Órdenes exportaba solo la página actual (ej. 19 de 93 órdenes en 4 páginas). Las tablas con filtros del lado del cliente exportaban todo, ignorando los filtros.

## Resultado final
Revisadas todas las vistas con `ExportExcelButton`. Las demás (Resumen, Visitas, Productos, Categorías, Formas de pago, Buscar compradores, metas, Venta/Ticket/Tráfico diario, Cierre de mes, Ventas mayoreo) ya exportaban lo mismo que muestran con sus filtros y no tienen paginación.
