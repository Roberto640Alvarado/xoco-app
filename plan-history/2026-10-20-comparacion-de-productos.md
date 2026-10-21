# Comparación de productos (sección nueva)

## Objetivo

Separar la comparación de productos de Mejores productos en su propia sección (Productos → Comparación) con filtros, gráfica y tabla propios.

## Cambios realizados

- Nueva ruta `/dashboard/comparacion-productos` (`ProductComparisonView` en `features/sales/components`).
- `PeriodComparisonFilter`: atajos (mes actual vs. anterior —por defecto—, vs. mismos días del mes anterior, vs. mismo mes del año pasado, últimos dos meses completos, últimos 30 días vs. 30 previos), "Elegir meses" y "Personalizado" (un calendario por período). Misma validación que la API.
- Períodos y tienda en la URL con nuqs (`aDesde`, `aHasta`, `bDesde`, `bHasta`, `tienda`); el Vendedor siempre queda en su tienda (selector bloqueado y la API lo fuerza).
- Totales con `ComparisonStat`, gráfica de barras por producto (Unidades / Ingresos, orden y "Mostrar N") y tabla completa con el cambio por producto (`DataTable`). Exportar a Excel con hoja de resumen y de productos.
- Componentes nuevos en el sistema de diseño: `ChangeIndicator`, `ComparisonStat` y `SegmentedControl` (Categorías ahora usa este último en vez de su toggle propio).
- Mejores productos ya no muestra la comparación; tour actualizado.
- Permisos: moduleKey `dashboard.comparacion-productos` en tipos, grupos, info del panel, menú y middleware (ruta permitida para Vendedor).

## Razones del cambio

La pantalla de Mejores productos mezclaba rankings filtrados por fecha con una comparación de meses fija que no usaba esos filtros.

## Resultado final

Build y lint sin errores (solo 2 warnings que ya existían).
