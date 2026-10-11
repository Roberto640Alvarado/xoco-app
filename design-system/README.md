# Sistema de diseño

Aquí vive todo lo visual del panel: qué componentes existen, cuándo usar cada uno y un catálogo con ejemplos en vivo.

**Regla:** todo componente o patrón visual nuevo se agrega a este catálogo (ejemplo en `showcase.tsx` + una línea en este README) en el mismo cambio en que se crea.

## Dónde vive cada cosa

- `design-system/components/`: los componentes propios del panel (SectionCard, Panel, TourGuideCard, NoticeCard, InfoBadge, ValueBox, DataTable). Se importan con `@/design-system/components/<nombre>`.
- `components/ui/`: los componentes base de shadcn/ui (Button, Input, Select, Dialog...), instalados con la CLI.
- `design-system/showcase.tsx`: catálogo en vivo de todo lo anterior.

## Ver el catálogo

Entra como Admin a **Administración → Sistema de diseño** (`/dashboard/admin/design-system`). El código de la página está en `design-system/showcase.tsx`.

## Botones (`components/ui/button.tsx`)

| Variante | Cuándo | Ejemplo |
| --- | --- | --- |
| `default` (primary) | La acción principal de la pantalla. Una sola por pantalla. | Guardar cambios |
| Agregar | `default` + ícono `Plus` (o el ícono del objeto) + verbo en infinitivo. | Registrar movimiento, Solicitar stock |
| `secondary` | Apoyo que no compite con la acción principal. Lleva borde y sombra suave para verse en modo claro. | Iniciar tour |
| `outline` | Acciones neutrales: filtros, exportar, ver detalle. | Exportar |
| `destructive` | Rechazar, eliminar, ocultar. | Rechazar |
| `ghost` / `link` | Bajo énfasis: cancelar, "más información". | Cancelar |

Tamaños: `lg`, `default`, `sm`, `xs` y los `icon*`. Los botones de las cards usan `default`/`sm`.

## Badges (`design-system/components/info-badge.tsx`)

`InfoBadge` con `tone`: `warning` (espera algo), `info` (en curso), `success` (listo), `danger` (rechazado o error), `violet` (en tránsito), `neutral` (sin énfasis). Con `dot` para estados, con `icon` para avisos. Roles: Admin `violet`, Finanzas `info`, Vendedor `warning`.

## Cards

- `SectionCard` (`design-system/components/section-card.tsx`): encabezado de pantalla con ícono, título, una frase y los botones a la derecha (`controlsOnly` cuando hay varios controles: queda solo la fila de controles, en una sola línea, sin ícono ni título). Es el encabezado de todas las pantallas de Inventario (Conteo, Solicitudes, Movimientos, Registro y Habilitación por tienda) y el que se usa en las secciones nuevas. Uso: `<SectionCard icon={PackagePlus} title="Solicitudes" description="Pide stock y sigue tus solicitudes.">{selector y botones}</SectionCard>`. La descripción es una sola frase corta; con varios filtros, `<SectionCard controlsOnly>`; `tourId` para el tour guiado.
- `ReportHeader` (`features/page-guide/components/report-header.tsx`): encabezado de toda sección de reportes (Ventas, Tráfico, Productos, Tickets, Mayoreo, Cierre del mes). Junta la card del tour guiado con una `SectionCard` y los controles de la pantalla; el título, la frase corta, el tour y el modal salen de `features/page-guide/content.ts` según el rol. Una sección nueva se agrega ahí (`REPORT_GUIDES`) y usa `<ReportHeader page="...">`. También lo usan las pantallas de Administración (`admin-inicio`, `admin-odoo`, `admin-usuarios`, `admin-permisos`, `admin-diseno`); el bloque que sigue al encabezado es el ancla del primer paso del tour.
- `Panel` (`design-system/components/panel.tsx`): la card de contenido que va debajo del encabezado: formularios, listas y tablas. Título, frase corta, `badge` de estado y `action` a la derecha; `flush` para listas y tablas que llegan al borde; `tourId` para el tour. Es el hermano de `SectionCard`. Se usa en todo Administración.
- `TourGuideCard` (`design-system/components/tour-guide-card.tsx`): el título siempre es "Tour guiado"; "Iniciar tour" es `secondary`; ⓘ abre la explicación.
- `NoticeCard` (`design-system/components/notice-card.tsx`): aviso con tono (`info`, `success`, `warning`), una frase y un botón opcional.

Texto de las cards: una frase corta, sin guiones largos ("—"), y los botones siempre a la vista.

## Tablas (`design-system/components/data-table.tsx`)

`DataTable<T>` es la tabla estándar de Inventario (Conteo, Solicitudes, Movimientos, Registro):

- Encabezado fijo; ícono de filtro junto al título de cada columna con `filter` (`text` o `select`).
- Pie con "Mostrando X–Y de N", "Limpiar filtros", filas por página (10, 25, 50, 100) y paginación.
- Wrap de texto (`nowrap` solo para fechas y cantidades); en móvil se vuelve tarjetas (`mobile: "title" | "footer" | "hidden"`).
- `onRowClick` para abrir un modal de detalle; la tabla muestra lo esencial y el resto vive en el modal.
- Tabla de captura (Conteo): `ValueBox` (`design-system/components/value-box.tsx`) para el valor de solo lectura y un `Input` con borde marcado para el editable.

## Otros

- `InfoHint` (`features/inventory-guide/components/info-hint.tsx`): ⓘ que abre un modal con la explicación de un concepto.
- Tokens, animación y principios generales: sección "Sistema de Diseño" de `CLAUDE.md`.
