# Inicio de Administración más limpio

## Objetivo
Quitar de la vista de inicio de Administración la card de encabezado y la tarjeta de Sistema de diseño.

## Cambios realizados
- Se quitó la card "Administración / Configuración exclusiva del Admin." (el inicio usa solo la card del Tour guiado) y la tarjeta "Sistema de diseño". La página sigue disponible en `/dashboard/admin/design-system`.
- Tour del inicio: el paso "Configuraciones" apunta a la cuadrícula (`admin-sections`) y su texto ya no menciona Sistema de diseño.

## Resultado final
`tsc` sin errores y `eslint` solo con los avisos previos.
