# Notificaciones por rol

## Objetivo
Mostrar a cada rol sus avisos de solicitudes y movimientos con una campana junto al cambio de tema, que abre un panel lateral.

## Cambios realizados
- `features/notifications/` (types, api, hook `useNotifications` con refresco cada 60 s, componente `NotificationsBell`).
- `components/layout/dashboard-shell.tsx`: campana a la par del `ThemeToggle`.

## Razones
- Se usó el `Sheet` existente (base-ui) en lugar de instalar el dropdown de radix del ejemplo.
- El Vendedor manda `sinceMovements` (última visita a Movimientos) para ver solo lo nuevo.

## Resultado final
Campana con contador animado; panel con avisos agrupados en Hoy/Antes, icono por tono, tiempo relativo, skeleton, estado "¡Todo al día!" y navegación a la pantalla de cada aviso.
