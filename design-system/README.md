# Sistema de diseño

Aquí vive todo lo visual del panel: qué componentes existen, cuándo usar cada uno y un catálogo con ejemplos en vivo.

**Regla:** todo componente o patrón visual nuevo se agrega a este catálogo (ejemplo en `showcase.tsx` + una línea en este README) en el mismo cambio en que se crea.

## Ver el catálogo

Entra como Admin a **Administración → Sistema de diseño** (`/dashboard/admin/design-system`). El código de la página está en `design-system/showcase.tsx`.

## Botones (`components/ui/button.tsx`)

| Variante | Cuándo | Ejemplo |
| --- | --- | --- |
| `default` (primary) | La acción principal de la pantalla. Una sola por pantalla. | Guardar cambios |
| Agregar | `default` + ícono `Plus` (o el ícono del objeto) + verbo en infinitivo. | Registrar movimiento, Solicitar stock |
| `secondary` | Apoyo que no compite con la acción principal. | Iniciar tour |
| `outline` | Acciones neutrales: filtros, exportar, ver detalle. | Exportar |
| `destructive` | Rechazar, eliminar, ocultar. | Rechazar |
| `ghost` / `link` | Bajo énfasis: cancelar, "más información". | Cancelar |

Tamaños: `lg`, `default`, `sm`, `xs` y los `icon*`. Los botones de las cards usan `default`/`sm`.

## Badges (`components/ui/info-badge.tsx`)

`InfoBadge` con `tone`: `warning` (espera algo), `info` (en curso), `success` (listo), `danger` (rechazado o error), `violet` (en tránsito), `neutral` (sin énfasis). Con `dot` para estados, con `icon` para avisos. Roles: Admin `violet`, Finanzas `info`, Vendedor `warning`.

## Cards

- `SectionCard` (`components/ui/section-card.tsx`): encabezado de pantalla con ícono, título, una frase y los botones a la derecha (`stacked` si hay muchos filtros).
- `TourGuideCard` (`components/ui/tour-guide-card.tsx`): el título siempre es "Tour guiado"; "Iniciar tour" es `secondary`; ⓘ abre la explicación.
- `NoticeCard` (`components/ui/notice-card.tsx`): aviso con tono (`info`, `success`, `warning`), una frase y un botón opcional.

Texto de las cards: una frase corta, sin guiones largos ("—"), y los botones siempre a la vista.

## Tablas (`components/ui/data-table.tsx`)

`DataTable<T>` es la tabla estándar de Inventario (Conteo, Solicitudes, Movimientos, Registro):

- Encabezado fijo; ícono de filtro junto al título de cada columna con `filter` (`text` o `select`).
- Pie con "Mostrando X–Y de N", "Limpiar filtros", filas por página (10, 25, 50, 100) y paginación.
- Wrap de texto (`nowrap` solo para fechas y cantidades); en móvil se vuelve tarjetas (`mobile: "title" | "footer" | "hidden"`).
- `onRowClick` para abrir un modal de detalle; la tabla muestra lo esencial y el resto vive en el modal.
- Tabla de captura (Conteo): `ValueBox` (`components/ui/value-box.tsx`) para el valor de solo lectura y un `Input` con borde marcado para el editable.

## Otros

- `InfoHint` (`features/inventory-guide/components/info-hint.tsx`): ⓘ que abre un modal con la explicación de un concepto.
- Tokens, animación y principios generales: sección "Sistema de Diseño" de `CLAUDE.md`.
