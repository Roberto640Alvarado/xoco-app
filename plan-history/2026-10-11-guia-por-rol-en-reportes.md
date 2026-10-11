# Cards, tour y modal por rol en todas las secciones de reportes

## Objetivo
Llevar a Ventas, Tráfico, Productos, Tickets, Mayoreo y Cierre del mes la card de información y botones, el tour guiado y el modal de ayuda, mostrando solo lo que le toca a cada rol (Admin, Finanzas, Vendedor).

## Cambios realizados
- Nuevo `features/page-guide/`: `content.ts` (`REPORT_GUIDES` de 14 pantallas con título, ícono, frase corta, descripción, pasos del tour y permisos por rol), `useGuideTour` (hook genérico de driver.js; el de Inventario ahora lo reutiliza), `PageGuideBar` (card del tour con botón secundario + modal con descripción, "Tu rol" Puedes/No puedes y qué hay en la pantalla), `RolePermissions` y `ReportHeader` (tour + SectionCard + controles).
- Todas las pantallas migradas a `ReportHeader`: Resumen, Venta mensual, Venta diaria, Formas de pago, Visitas, Tráfico de tiendas, Tráfico diario, Mejores productos, Categorías, Ventas mayoreo, Buscar compradores, Ticket promedio, Ticket detallado y Cierre del mes. `SalesFiltersBar` recibe `page`. Se quitaron `FilterToolbar` y `FilterBar` y los títulos sueltos de Formas de pago, Categorías y Buscar compradores.
- Por rol: el Vendedor solo ve las pantallas que su rol puede abrir y su tienda queda fija; Admin y Finanzas eligen tienda o todas, configuran el % de las metas y exportan; solo el Admin decide qué roles ven cada sección.
- Anclas del tour: `report-header`, el bloque siguiente (`+ *`) y `goal-config` en los botones "Configurar %".

## Pendiente
- Las pantallas de Administración (Odoo, Usuarios, Permisos) no tienen tour: son solo del Admin.
