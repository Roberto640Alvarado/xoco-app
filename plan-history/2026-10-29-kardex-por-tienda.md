# Kardex de inventario por tienda

## Objetivo
Pantalla Inventario → Kardex: cada tienda ve y descarga su kardex (PDF/Excel); Admin y Finanzas eligen la tienda.

## Cambios realizados
- Feature `features/inventory-kardex` (api, hook, tipos, `lib/kardex-pdf.ts`, `lib/kardex-excel.ts`, `lib/kardex-format.ts`, `KardexView`, `KardexProductCard`). Página `app/dashboard/inventario/kardex`.
- Vista: tienda (bloqueada para Vendedor), rango (por defecto el mes en curso), totales, búsqueda, filtro por categoría y "Con movimientos / Todos". Cada producto muestra Inicial → Entradas/Salidas/Ajustes → Final con una línea del saldo; al abrirlo, la tabla de kardex (en móvil, lista).
- PDF carta horizontal: encabezado de marca, totales, resumen por categoría, detalle por producto con saldo inicial/final, firmas y paginación. Excel: hojas "Resumen" y "Kardex".
- Menú (Kardex, mismo módulo que Conteo/Registro) y guía/tour de Inventario.

## Razones del cambio
Pedido del usuario: reportes de inventario tipo kardex por tienda, bien presentados y descargables.

## Resultado final
`tsc` y ESLint sin errores. Pendiente revisión visual con sesión iniciada.

## Ajuste: rediseño y página cortada en laptop
- Causa del corte: `SidebarInset` (main del panel) sin `min-w-0`; una fila ancha con scroll horizontal (chips de categorías, pestañas por tienda de Despacho) estiraba toda la página. Se agregó `min-w-0` en `dashboard-shell.tsx` (arregla todas las pantallas).
- Kardex rediseñado: encabezado con tienda + período y descargas; filtros en una card que se acomoda (tienda, fechas, búsqueda, categoría en un select, Con movimientos/Todos con contadores); totales (con movimiento, entró, salió, sin conteo); aviso de productos sin conteo (con "Ir a Conteo" para Admin/Finanzas); leyenda en palabras simples; una sola tabla por categoría (Inicial · Entró · Salió · Ajuste · Final) donde cada fila se despliega con su kardex ("Qué pasó", "Queda"); en móvil, tarjetas con cajitas etiquetadas. `KardexProductCard` reemplazada por `KardexProductRow`.
