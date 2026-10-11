# Odoo: ancho responsive, modal para agregar la API key e historial

## Objetivo
Corregir el ancho de las cards de Administración, agregar un botón secundario que abra un modal para agregar la API key y una tabla con la key actual y las pasadas.

## Cambios realizados
- xoco-api: cada rotación crea un documento nuevo en `odoo_config` y deja los anteriores con `isActive=false` (campo nuevo `createdByEmail`). Nuevo `GET /odoo/config/history` (Super admin) con las keys enmascaradas.
- xoco-app: botón secundario "Agregar API key" en el encabezado que abre `RotateOdooConfigModal`; el formulario sale de la página. `OdooConfigHistory` usa `DataTable` (Registrada, API key, uid, Duración, Expira, Registrada por, Estado con filtros).
- Estado actual: 1, 2 o 4 columnas según el ancho. Odoo, Usuarios, Permisos e Inventario por tienda ya no tienen `max-w`; los grupos de Permisos van en 2 columnas desde `lg`.
- Tour de Odoo con 3 pasos (botón, estado, historial).

## Resultado final
`tsc` sin errores y `eslint` solo con los avisos previos de `watch()`.
