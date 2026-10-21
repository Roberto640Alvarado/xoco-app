# Tickets → Órdenes

## Objetivo

Nueva subsección en Tickets para ver cada orden de caja a detalle, con filtros de fechas y tienda, responsive, y con el Vendedor limitado a su tienda.

## Cambios realizados

- Ruta `/dashboard/ordenes` y feature `features/pos-tickets` (api, hooks, tipos, utils y componentes).
- Encabezado con rango de fechas (por defecto últimos 7 días), tienda y exportar la página a Excel. Filtros, búsqueda, orden, página y filas en la URL (nuqs).
- Totales del filtro: órdenes, venta total y ticket promedio.
- Tabla de órdenes (número de recibo y estado, fecha y hora, tienda, cajero/cliente, productos, métodos de pago, total y "Ver detalle"); en móvil se vuelve tarjetas con el botón al pie. Búsqueda por orden, recibo o cliente, y orden por fecha o total.
- Modal de detalle: total destacado, tienda, cajero, cliente y sesión; lista de productos con cantidad × precio, descuento y granel; pagos por método; subtotal, impuestos, total, pagado y cambio. Muestra la fila al instante mientras carga el detalle y mensajes claros para 403/404.
- `DataTable` ahora acepta `serverPagination` (página que viene de la API).
- `lib/local-date.ts`: fechas locales compartidas (la comparación de productos ahora las usa también).
- Permisos (`dashboard.ordenes`), menú, middleware (ruta permitida al Vendedor) y tour guiado.

## Razones del cambio

Revisar los tickets uno por uno sin entrar a Odoo.

## Resultado final

Lint y tipos sin errores; build correcto.

## Segunda pasada: diseño del listado, del detalle y filtro de un día

- Listado propio (`tickets-list.tsx`) en vez de la tabla genérica: agrupado por día cuando el orden es por fecha (con "Hoy"/"Ayer" y el total del día en la página), la hora grande como ancla de cada fila, número y estado, tienda/cajero/cliente con íconos, métodos de pago, total con productos y "Ver detalle". En móvil se reacomoda en dos líneas, sin scroll horizontal. Estado vacío con indicación de qué cambiar.
- Modal de detalle como recibo de caja: borde troquelado, líneas punteadas, puntos guía en subtotal/impuestos/total/pagos/cambio y cifras tabulares; al lado (o arriba en móvil) el total cobrado y los datos de la orden. Granel con precio por kg.
- `TablePagination` extraído de `DataTable` al sistema de diseño (lo usan ambos).
- `DateRangeFilter` (todas las pantallas): atajo "Ayer" y, en Personalizado, "Un día" o "Rango"; el calendario de rango muestra un mes en móvil.
- API: `priceUnit` con 4 decimales para no perder el precio por gramo del granel.
- Revisado con capturas en escritorio (1280 px) y móvil (390 px) con datos de muestra.
