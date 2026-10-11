# Tour guiado y ayudas de información en Inventario

## Contexto
Para que Admin/Finanzas y Vendedores entiendan el flujo de Inventario (conteo, movimientos, solicitudes de stock, recepción y confirmación) sin explicación aparte.

## Cambios
- Dependencia nueva: `driver.js` (tour guiado, sin dependencias de React; se carga con import dinámico al iniciar el tour).
- `features/inventory-guide/`:
  - `content.ts`: todo el texto en un solo archivo, por rol (admin = Super admin/Finanzas; vendedor): flujo paso a paso, qué hace cada pantalla, pasos del tour por pantalla y textos de los ⓘ.
  - `InventoryGuideBar` (montada en `app/dashboard/inventario/layout.tsx`, así aparece en Conteo, Solicitudes, Movimientos y Registro): botón "Cómo funciona" (modal con flujo + pantallas, resalta la actual) y "Tour de esta pantalla" (con puntito hasta que se inicia por primera vez, recordado en localStorage por usuario y pantalla).
  - `InfoHint`: ícono ⓘ que abre un modal con la explicación (Existencia estimada, Estados de solicitud/movimiento, Tipos del Registro), puesto en los encabezados de las tablas.
  - `useInventoryTour`: arma los pasos descartando los que apuntan a elementos ocultos o de otro rol.
- Anclas `data-tour` en las vistas; `tourId` opcional en `FilterToolbar`, `StoreSelect` y `ExportExcelButton`.
- Estilos del popover del tour en `app/globals.css` (colores del tema claro/oscuro).
