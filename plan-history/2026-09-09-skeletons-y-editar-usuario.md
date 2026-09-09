# Skeletons animados en todo el dashboard + editar usuario

## Contexto

Sobre lo ya hecho en "guardia-admin-cambio-password-rediseno", el usuario pidió 2 cosas más en el mismo mensaje:

1. Poder editar el rol, correo y nombre de un usuario existente (antes solo se podía crear, activar/desactivar y cambiar contraseña).
2. "Pone Skeleton en las vistas y pone Loading asi con animacion" — reemplazar el "Cargando..." de texto plano por skeletons animados.

Se confirmó por `AskUserQuestion`: editar usuario vía modal (mismo patrón que el de cambiar contraseña) y skeletons en **todo el dashboard**, no solo Administración.

## Skeletons

`components/ui/skeleton.tsx` ya existía (`animate-pulse rounded-md bg-muted`) pero no se usaba en ningún lado excepto `sidebar.tsx`. Se agregaron 2 componentes reutilizables sobre él:

- **`components/ui/table-skeleton.tsx`** (`TableSkeletonRows`): filas `<tr>/<td>` planas (funcionan igual dentro de un `<tbody>` a mano o de `<TableBody>` de `components/ui/table.tsx` — ambos son solo un `<tbody>` con estilos). Recibe `rows`/`columns`.
- **`components/ui/chart-skeleton.tsx`** (`ChartSkeleton`): barras de alturas relativas fijas (no aleatorias en cada render) que insinúan una gráfica de barras real, del mismo alto (`height` en px) que el `Cargando...` que reemplazan.

Se aplicó reemplazando el bloque `isLoading ? <...Cargando.../> : ...` en:

- Tablas con `<table>` a mano: `month-close-section.tsx` (1 fila, 5 columnas), `traffic-goals-table.tsx` (4 filas, `COLUMNS.length + 1`), `monthly-sales-table.tsx` (4 filas, 5 columnas), `average-ticket-table.tsx` (4 filas, 4 columnas).
- Tablas sobre `components/ui/table.tsx`: `daily-sales-table.tsx`, `daily-ticket-table.tsx`, `daily-traffic-table.tsx` (6 filas, 2 columnas cada una — listas de días con scroll).
- Gráficas (`ChartSkeleton`, altura igual al `h-64`/`h-72` que tenían): `store-reach-chart.tsx`, `sales-reach-chart.tsx`, `ticket-reach-chart.tsx` (256px), `daily-ticket-comparison-chart.tsx`, `store-daily-ticket-chart.tsx`, `daily-traffic-comparison-chart.tsx`, `store-daily-traffic-chart.tsx`, `daily-sales-comparison-chart.tsx`, `store-daily-sales-chart.tsx` (288px).
- `components/ui/stat-tile.tsx`: mostraba `"—"` fijo mientras `isLoading` — ahora un `<Skeleton>` del tamaño del número.
- `app/dashboard/admin/odoo/page.tsx`: el bloque "Estado actual" (antes `<p>Cargando...</p>`) ahora reproduce la forma del `<dl>` real (4 pares label/valor).
- `features/users/components/users-table.tsx`: también migrada de una fila con `colSpan` a `TableSkeletonRows`.

**No se tocó** el "Cargando..." que aparece como `placeholder` dentro de un `<SelectValue>` mientras cargan las tiendas (`sales-filters.tsx`, y los `*-view.tsx` de Venta/Tráfico/Ticket Diario) — es texto dentro del trigger de un dropdown, no un bloque de contenido; un skeleton no encaja ahí y se dejó como estaba.

## Editar usuario

**Backend**: ver plan-history de xoco-api ("cambio-password-usuario" cubre el password; el edit tiene su propio archivo "PATCH /users/:id").

**Frontend** (`features/users/`): mismo patrón que el resto del módulo.
- `types/users.types.ts` — `UpdateUserPayload { email, name?, role }`.
- `api/users.api.ts` — `updateUser` (usa `apiPatch` a `/users/${id}`, sin sufijo).
- `hooks/use-update-user.ts` — `useMutation`, actualiza `["users"]` en caché directo (mismo criterio que `useSetUserActive`).
- `schemas/update-user.schema.ts` — zod, sin `.refine()` (no hay 2 campos que deban coincidir, a diferencia de crear/cambiar contraseña).
- `components/edit-user-modal.tsx` — mismo patrón de `SetUserPasswordModal` (Dialog controlado desde afuera, éxito que auto-cierra), con react-hook-form precargado con los datos ACTUALES del usuario al abrirse. El `<Select>` de rol sale `disabled` cuando `isSelf` (se le pasa como prop desde `UsersTable`, comparando `editTarget?.id === currentUserId`) — el backend rechaza (403) que un SUPER_ADMIN cambie su propio rol, así que ni se ofrece la opción en la UI.
- `components/users-table.tsx`: nuevo botón "Editar" (ícono `Pencil`) junto al de "Cambiar contraseña" en la columna Acciones.

## Verificación

- `npm run lint` y `npm run build` limpios (mismo warning preexistente de siempre).
- Backend probado en proceso contra Mongo real (ver plan-history de xoco-api).
- De nuevo, no se pudo probar la UI en vivo en el navegador en esta sesión (mismo límite ya documentado 2 veces).

## Pendiente

- El usuario debe revisar en vivo: que los skeletons se vean bien (tamaño, no "saltan" al cargar los datos reales), que el modal de "Editar usuario" precargue bien los datos y que el selector de rol salga bloqueado al editarse a sí mismo, y que intentar poner un correo ya usado por otro usuario muestre el error de conflicto.
