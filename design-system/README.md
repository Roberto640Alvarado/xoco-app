# Sistema de diseño

Aquí vive todo lo visual del panel: qué componentes existen, cuándo usar cada uno y un catálogo con ejemplos en vivo.

**Regla:** todo componente o patrón visual nuevo se agrega a este catálogo (ejemplo en `showcase.tsx` + una línea en este README) en el mismo cambio en que se crea.

## Dónde vive cada cosa

- `design-system/components/`: los componentes propios del panel (SectionCard, Panel, TourGuideCard, NoticeCard, InfoBadge, ChangeIndicator, ComparisonStat, SegmentedControl, QuantityStepper, ProgressSteps, HelpSteps, PreviewSheet, DeliveryTruck, SuccessCelebration, ValueBox, DataTable). Se importan con `@/design-system/components/<nombre>`.
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

`InfoBadge` con `tone`: `warning` (espera algo), `info` (en curso), `success` (listo), `danger` (rechazado o error), `violet` (en tránsito), `neutral` (sin énfasis). Con `dot` para estados, con `icon` para avisos. Roles: Admin `violet`, Finanzas `info`, Vendedor `warning`, Planta `success`.

## Cantidades y avance de procesos

- `QuantityStepper` (`design-system/components/quantity-stepper.tsx`): cantidad con botones − / + y campo editable (`step` 1 para piezas, 0.5 para kg). `value={null}` es "sin responder": campo vacío. `size="lg"` para formularios de tienda y planta (botones grandes). Es el control de cantidad de Inventario → Solicitudes (pedir, responder y recibir).
- `ProgressSteps` (`design-system/components/progress-steps.tsx`): línea de pasos de un proceso (hechos en verde, actual resaltado, pendientes en gris; `failed` marca el actual en rojo; `compact` para tarjetas). Repite el estado con número, ✓ o ✕ para no depender del color. La usa el avance de las solicitudes de stock.

## Formularios guiados (tienda y planta)

Para personas que casi no usan computadora: una sola cosa por paso, botones grandes y lo que se va a enviar siempre a la vista.

- `HelpSteps` (`design-system/components/help-steps.tsx`): "qué hago ahora" en 3 pasos grandes con número, ícono y una frase; el actual resaltado y los hechos con ✓. En móvil solo se ve el paso actual. Va arriba de Nueva solicitud y de la respuesta de planta.
- `PreviewSheet` (`design-system/components/preview-sheet.tsx`): hoja de papel con borde punteado y un listón "Solo es una vista previa de cómo va quedando. Todavía no se ha enviado nada." Muestra en vivo lo que recibirá el otro lado mientras se llena el formulario.
- `SuccessCelebration` (`design-system/components/success-celebration.tsx`): pantalla breve de "¡Listo!" (✓ con rebote y confeti, o un dibujo propio en `visual`) tras enviar una solicitud o despachar. `role="status"`.
- `DeliveryTruck` (`design-system/components/delivery-truck.tsx`): camión animado con la tableta de chocolate en la caja. `mode="road"` rueda en su lugar sobre la carretera (envío EN_CAMINO en tarjeta y detalle); `mode="depart"` arranca y sale (al despachar). `size` sm, md o lg. Todo respeta `prefers-reduced-motion`.

## Comparación de períodos

- `ChangeIndicator` (`design-system/components/change-indicator.tsx`): pastilla de cambio A vs. B con flecha y % con signo. Sube en `success`, baja en `danger`, sin cambio en `neutral`; "Nuevo" cuando B es 0. La flecha y el signo repiten el sentido para no depender del color.
- `ComparisonStat` (`design-system/components/comparison-stat.tsx`): tarjeta de número de un período contra otro: cada valor con el nombre de su período y el punto de color de la gráfica (azul = A, gris = B); el principal en grande con su `ChangeIndicator` y el comparado debajo. Misma forma que `StatTile`. La usa Productos → Comparación.
- `SegmentedControl` (`design-system/components/segmented-control.tsx`): 2-3 opciones excluyentes en una pastilla (ej. Unidades / Ingresos, Por dinero / Por unidad). Para más opciones, un `Select`.

## Cards

- `SectionCard` (`design-system/components/section-card.tsx`): encabezado de pantalla con ícono, título, una frase y los botones a la derecha (`controlsOnly` cuando hay varios controles: queda solo la fila de controles, en una sola línea, sin ícono ni título). Es el encabezado de todas las pantallas de Inventario (Conteo, Solicitudes, Movimientos, Registro y Habilitación por tienda) y el que se usa en las secciones nuevas. Uso: `<SectionCard icon={PackagePlus} title="Solicitudes" description="Pide stock y sigue tus solicitudes.">{selector y botones}</SectionCard>`. La descripción es una sola frase corta; con varios filtros, `<SectionCard controlsOnly>`; `tourId` para el tour guiado.
- `ReportHeader` (`features/page-guide/components/report-header.tsx`): encabezado de toda sección de reportes (Ventas, Tráfico, Productos, Tickets, Mayoreo, Cierre del mes). Junta la card del tour guiado con una `SectionCard` y los controles de la pantalla; el título, la frase corta, el tour y el modal salen de `features/page-guide/content.ts` según el rol. Una sección nueva se agrega ahí (`REPORT_GUIDES`) y usa `<ReportHeader page="...">`. También lo usan las pantallas de Administración (`admin-inicio`, `admin-odoo`, `admin-usuarios`, `admin-permisos`, `admin-diseno`); el bloque que sigue al encabezado es el ancla del primer paso del tour.
- `Panel` (`design-system/components/panel.tsx`): la card de contenido que va debajo del encabezado: formularios, listas y tablas. Título, frase corta, `badge` de estado y `action` a la derecha; `flush` para listas y tablas que llegan al borde; `tourId` para el tour. Es el hermano de `SectionCard`. Se usa en todo Administración. Las pantallas ocupan todo el ancho (sin `max-w`) y las cuadrículas internas se reacomodan: 1 columna en móvil, 2 en `sm`/`lg`, 4 en `xl`.
- `ChocolateLoader` (`design-system/components/chocolate-loader.tsx`): animación de carga con una barra de chocolate (`size` sm, md o lg; `label` opcional; `delayed` para que aparezca con retraso). Va en las cargas de página completa: el arranque del panel, el cambio de sección (`app/dashboard/loading.tsx`) y las pantallas de espera. Las tablas y gráficas siguen con sus esqueletos y los botones con el ícono giratorio. Respeta `prefers-reduced-motion`.
- `ChocolateBreak` (`design-system/components/chocolate-break.tsx`): tableta de chocolate que se parte en dos, suelta migas y se vuelve a unir. Es la animación de "Iniciando sesión en Xocolatísimo" (`features/auth/components/login-overlay.tsx`); se queda quieta con `prefers-reduced-motion`.
- `TourGuideCard` (`design-system/components/tour-guide-card.tsx`): el título siempre es "Tour guiado"; "Iniciar tour" es `secondary`; ⓘ abre la explicación.
- `NoticeCard` (`design-system/components/notice-card.tsx`): aviso con tono (`info`, `success`, `warning`), una frase y un botón opcional.

Texto de las cards: una frase corta, sin guiones largos ("—"), y los botones siempre a la vista.

## Tablas (`design-system/components/data-table.tsx`)

`DataTable<T>` es la tabla estándar de Inventario (Conteo, Solicitudes, Movimientos, Registro):

- Encabezado fijo; ícono de filtro junto al título de cada columna con `filter` (`text` o `select`).
- Pie con "Mostrando X–Y de N", "Limpiar filtros", filas por página (10, 25, 50, 100) y paginación.
- Wrap de texto (`nowrap` solo para fechas y cantidades); en móvil se vuelve tarjetas (`mobile: "title" | "footer" | "hidden"`).
- `onRowClick` para abrir un modal de detalle; la tabla muestra lo esencial y el resto vive en el modal.
- `TablePagination` (`design-system/components/table-pagination.tsx`): el pie de paginación (Mostrando X–Y de N, filas por página y botones). Lo usa `DataTable` y los listados que pagina la API (ej. Tickets → Órdenes).
- Tabla de captura (Conteo): `ValueBox` (`design-system/components/value-box.tsx`) para el valor de solo lectura y un `Input` con borde marcado para el editable.

## Recibo de orden

El detalle de una orden (Tickets → Órdenes) se dibuja como el recibo de la caja: fondo `muted`, borde troquelado arriba y abajo, líneas separadas con guiones, montos con puntos guía y cifras tabulares. Es el único lugar del panel con ese tratamiento; no se reutiliza para otras cards.

## Otros

- `InfoHint` (`features/inventory-guide/components/info-hint.tsx`): ⓘ que abre un modal con la explicación de un concepto.
- Tokens, animación y principios generales: sección "Sistema de Diseño" de `CLAUDE.md`.
