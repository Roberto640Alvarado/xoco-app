# Tablas estándar de Inventario

## Pedido
Las tablas de Inventario (Conteo, Solicitudes, Movimientos y Registro) debían tener el mismo formato: encabezado, filtros por columna, pie con el total de resultados, filas por página configurables (de 10 en 10 o distinto) y wrap para ser responsive.

## Qué se hizo
- Nuevo `components/ui/data-table.tsx` (`DataTable<T>`): encabezado fijo, fila de filtros por columna (texto sin acentos o lista "Todos"), pie con "Mostrando X–Y de N", "Limpiar filtros", selector de filas por página (10/25/50/100, 10 por defecto) y paginación (primera/anterior/siguiente/última). Texto con wrap; en pantallas chicas se vuelve tarjetas apiladas con panel plegable de filtros.
- `InventoryTable` (Conteo): sin buscador (ahora es el filtro de la columna Producto); los borradores se conservan al paginar/filtrar; inputs como funciones de render para no perder el foco.
- `MovementsTable` (Solicitudes y Movimientos) y `InventoryLedger` (Registro) migradas a `DataTable`; acciones al pie de la tarjeta en móvil.
- Tour de Conteo: el paso `inv-search` ahora apunta a la fila de filtros y menciona las filas por página.

## Notas
- Filtrado y paginación son del lado del cliente sobre las filas ya cargadas.
