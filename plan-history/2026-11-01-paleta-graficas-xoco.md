# Paleta de gráficas de Xoco y esqueletos de carga

## Objetivo
Usar en todas las gráficas los colores de Xoco (chocolate para el dato principal, caramelo para la comparación) y mostrar esqueletos mientras cargan, en todos los perfiles.

## Cambios realizados
- `app/globals.css`: tokens `--chart-1..5` con la paleta de Xoco. Claro: #7b4a30 chocolate, #d0996c caramelo, #3b2216 cacao, #c9a35a dorado, #6f8f72 salvia. Oscuro: versiones más claras (#c4835a, #f0c9a0, #f5e6d3, #e6c77c, #8fb393) para leerse sobre fondo oscuro.
- Todas las gráficas ya usaban esos tokens (ventas, tráfico, ticket, metas, mayoreo, productos, formas de pago, comparaciones), así que cambian solas; también las etiquetas de periodo de `ComparisonStat` y del filtro de comparación.
- Gráficas nuevas pasadas a tokens: Ventas de hoy, Pedidos de Planta y las gráficas del chat de Xoco IA. Gasto de IA conserva los colores de marca de Claude y ChatGPT.
- Esqueletos: Ventas de hoy (Admin/Finanzas con tarjetas de tienda; Vendedor), Pedidos de Planta (números, tarjetas y gráfica) y Gasto de IA (gráfica, por IA, por usuario y tabla). Las gráficas existentes ya tenían `ChartSkeleton`.

## Razones
Pedido del usuario: una sola identidad de colores para Xoco en todas las gráficas.

## Resultado final
Gráficas con los colores de Xoco en claro y oscuro, y estados de carga consistentes.
