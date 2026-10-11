# Avisos de movimientos pendientes (frontend)

## Contexto
Ver el plan homónimo en xoco-api. Aviso dentro de la app, sin servicios externos.

## Cambios
- Globo rojo con conteo junto a Inventario → Movimientos y en el submenú Inventario (con el sidebar colapsado queda un punto). Tooltip: "N por confirmar" (Admin/Finanzas) o "N por recibir · N resueltos" (Vendedor).
- `useMovementNotifications`: consulta cada minuto y al volver a la pestaña; las mutaciones (crear, confirmar/rechazar, recibir) lo invalidan al instante.
- Vendedor: al abrir Movimientos se guarda la última visita en localStorage (por email, solo comodidad por dispositivo) y se manda como `since`.
- `DashboardShell`: `badge` / `badgeLabel` opcionales en los ítems del menú; `app/dashboard/layout.tsx` inyecta el globo en Movimientos.
