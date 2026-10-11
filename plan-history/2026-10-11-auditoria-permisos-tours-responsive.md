# Auditoría de permisos, tours y responsive

## Objetivo
Quitar "la ve" del panel de Permisos, mostrar las subsecciones, revisar que los accesos de Finanzas y Vendedor se manejen desde Permisos y queden blindados, actualizar los tours por rol y revisar el responsive.

## Hallazgos y cambios
- Permisos: "la ve" ahora es "Con acceso"; "Quién más la ve" pasa a "Acceso por rol". Inventario muestra sus pantallas: "Conteo y Registro" y "Solicitudes y Movimientos" (con chips y la aclaración de por qué van juntas y qué exige al Vendedor). Los avisos de datos compartidos solo nombran pantallas que el rol tiene.
- Middleware: la lista del Vendedor comparaba "/dashboard" por prefijo y dejaba pasar cualquier ruta. Ahora "/dashboard" es solo el Resumen e incluye Inventario.
- Bloqueo por ruta en el layout: si alguien abre por URL una sección que su rol no ve o que el Admin quitó, ve un aviso con enlace a una sección disponible, en vez de la pantalla.
- Los permisos del usuario se vuelven a consultar cada minuto y al volver a la pestaña (`usePermissionsRefresh`): si el Admin cambia un permiso, el menú se actualiza sin recargar.
- Tours: Buscar compradores pedía 3 letras y son 2; "Administración → Inventario" ahora dice "Inventario por tienda"; el Vendedor ve "Ver secciones que el Admin no te haya habilitado" en lo que no puede hacer.
- Responsive: el recuadro del tour se limita al ancho de la pantalla en celulares angostos. El resto se revisó en el código (grids con breakpoints, filtros que envuelven, tablas dentro de contenedores con scroll).

## Resultado final
`tsc` sin errores y `eslint` solo con los avisos previos.
