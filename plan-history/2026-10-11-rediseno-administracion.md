# Rediseño de Administración y tour guiado

## Objetivo
Llevar todas las pantallas de Administración al sistema de diseño nuevo: encabezado con tour guiado, cards de contenido y textos breves sin "—".

## Cambios realizados
- Nuevo componente `Panel` (`design-system/components/panel.tsx`): card de contenido con título, frase, badge, acción, `flush` y `tourId`. Documentado en el README y el showcase.
- `features/page-guide/content.ts`: guías `admin-inicio`, `admin-odoo`, `admin-usuarios`, `admin-permisos` y `admin-diseno` (solo Admin), con un `permissions` propio por guía.
- Todas las pantallas usan `ReportHeader` (card del tour + SectionCard) y quedan con el bloque ancla tras el encabezado.
- Odoo: dos `Panel` (estado con InfoBadge Vigente / Vencido / Sin configurar y datos en cajitas; rotar o registrar la key) y texto más corto.
- Usuarios: "Agregar usuario" sube al encabezado (`UsersView`), `UsersTable` queda controlada y dentro de un `Panel flush`; rol y estado con `InfoBadge`.
- Permisos: el selector de rol sube al encabezado; cada grupo de módulos es un `Panel flush` y el aviso de datos compartidos es un `NoticeCard`.
- Inventario por tienda: la lista de tiendas es un `Panel flush` con la ancla `access-list`.
- Inicio de Administración: encabezado con tour y tarjetas redondeadas con textos breves. Sistema de diseño: encabezado con tour.

## Resultado final
`tsc` sin errores y `eslint` solo con los 2 avisos previos de `watch()`.
