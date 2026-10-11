# Carpeta design-system y botón del tour secundario

## Objetivo
"Iniciar tour" no debe ser primario. Crear una carpeta en el repo donde viva todo el diseño, con botones (primary, secondary, destructive, agregar), badge de información, las tablas y la card del tour guiado.

## Cambios realizados
- `design-system/README.md`: guía de uso (botones, badges, cards, tablas) y regla de agregar todo componente nuevo al catálogo. `design-system/showcase.tsx`: catálogo en vivo.
- Página `/dashboard/admin/design-system` (solo Super admin, hereda la guarda de `/dashboard/admin`) y tarjeta "Sistema de diseño" en Administración.
- Nuevos componentes: `InfoBadge` (badge de información con tonos), `TourGuideCard` (botón "Iniciar tour" en `secondary`), `NoticeCard` y `ValueBox`.
- Refactor para usarlos: `InventoryGuideBar` (TourGuideCard + InfoBadge para el rol), avisos de visibilidad y del panel de habilitación (NoticeCard), `StatusPill` de movimientos (InfoBadge) y la caja de existencia estimada de Conteo (ValueBox).
- `CLAUDE.md`: regla de mantener el catálogo `design-system/`.

## Razones
Un solo lugar y un solo componente por patrón evita que cada pantalla reinvente botones, pastillas y cards; el botón secundario deja al primario para la acción principal.

## Resultado final
`tsc` y `eslint` sin errores nuevos.
