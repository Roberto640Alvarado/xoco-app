# Movimientos de inventario: merma, regalías y degustaciones (frontend)

## Objetivo

Exponer en el dashboard el nuevo ledger de movimientos de inventario (merma, regalía, degustación) que agrega xoco-api (ver plan-history del mismo nombre en xoco-api): Admin/Finanzas puede registrar y confirmar/rechazar movimientos de cualquier tienda; cada Vendedor puede registrar movimientos de su propia tienda, que quedan pendientes hasta que Admin/Finanzas los confirme.

## Cambios realizados

- **`features/permissions/types/permissions.types.ts`**: se agregó `"dashboard.inventario-movimientos"` a `MODULE_KEYS` y su etiqueta ("Movimientos de inventario") a `MODULE_LABEL` — mismo catálogo duplicado a mano que ya existía, ahora de 15 moduleKey.
- **`features/permissions/constants/module-groups.ts`**: se agregó el ícono (`PackageMinus`, mismo que el sidebar real) y se sumó el moduleKey al grupo "Otros" del panel de Permisos, junto a "Cierre del mes" e "Inventario".
- **`app/dashboard/layout.tsx`**: nuevo ítem de navegación "Movimientos de inventario" (ícono `PackageMinus`, ruta `/dashboard/inventario-movimientos`) — a diferencia del ítem "Inventario" existente (`roles: ["SUPER_ADMIN", "FINANZAS"]`), este sí incluye `"VENDEDOR"` en `roles`, porque el Vendedor necesita acceso a esta pantalla para registrar sus propios movimientos.
- **`features/inventory-movements/`** (feature nueva): `types/`, `api/` (fetch/create/confirm/reject contra las 4 rutas de `InventoryMovementsController`), `hooks/` (`useInventoryMovements`, `useCreateInventoryMovement`, `useResolveInventoryMovement`), `schemas/create-movement.schema.ts` (zod), `components/`:
  - `inventory-movements-view.tsx`: vista raíz, mismo patrón de scoping por tienda que el resto del dashboard (`useVendedorStoreFilter` + `StoreSelect lockedToSingleStore`) — Admin/Finanzas elige tienda libremente, Vendedor arranca y queda fijo en la suya.
  - `create-movement-dialog.tsx`: formulario modal (producto, motivo, cantidad, nota opcional) — el producto se elige del mismo catálogo que ya usa `InventoryTable` (`useInventoryItems`), sin duplicar una lista de productos aparte.
  - `movements-table.tsx`: tabla con pill de estado (Pendiente/Confirmado/Rechazado) e ícono por motivo; las acciones "Confirmar"/"Rechazar" (con `ConfirmDialog`) solo se muestran si `canResolve` (Admin/Finanzas) — el Vendedor ve la misma tabla sin esa columna.
- **`app/dashboard/inventario-movimientos/page.tsx`** (nuevo): monta `InventoryMovementsView`.
- **`components/ui/textarea.tsx`** (nuevo): no existía ningún campo de texto largo en el proyecto — se creó siguiendo el mismo criterio visual que `Input` (altura/padding/foco/estados), para la nota opcional del formulario.

## Razones del cambio

- **Por qué reusar `useInventoryItems` para el selector de producto en vez de un catálogo nuevo**: `GET /inventory/stores/:posConfigId/items` ya trae el catálogo completo de Odoo cruzado con lo capturado en Mongo para esa tienda — exactamente lo que hace falta para elegir qué producto tuvo la merma/regalía/degustación, sin pedirle a Odoo lo mismo dos veces.
- **Por qué `canResolve` se calcula en el frontend con el rol del usuario y no solo confiando en que el botón falle con 403**: aunque el backend ya protege `/confirm` y `/reject` con `@Roles(SUPER_ADMIN, FINANZAS)`, mostrarle el botón a un Vendedor para que falle al hacer clic es una mala experiencia — se oculta directamente, mismo criterio que el resto del dashboard (ej. "Tráfico de tiendas" oculta su propio control para Vendedor).
- **Por qué un componente `Textarea` nuevo en vez de un `<textarea>` suelto dentro del formulario**: para que luzca igual que el resto de los campos del formulario (mismo borde, mismo foco, mismo estado de error) sin duplicar esas clases a mano cada vez — y queda disponible para el próximo formulario del proyecto que necesite texto largo.

## Resultado final

`npx tsc --noEmit -p tsconfig.json`: sin errores. `npx eslint` sobre los 14 archivos nuevos/modificados: 0 errores (1 warning de import sin usar, corregido).
