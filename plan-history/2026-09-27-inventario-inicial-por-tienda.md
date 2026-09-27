# Módulo Inventario — Tramo 1: inventario inicial por tienda

## Contexto

Mismo contexto que el plan-history hermano en xoco-api: se reemplaza el placeholder "En desarrollo..." de `/dashboard/inventario` por la vista real del primer tramo — captura, centralizada por Finanzas, del inventario físico inicial de cada tienda, para TODO el catálogo de Odoo. Vendedor NO tiene acceso en este tramo.

## Cambios realizados

- **`components/filters/store-select.tsx`**: nuevo prop `hideAllStoresOption` (independiente de `lockedToSingleStore`) — oculta "Todas las tiendas" sin deshabilitar el selector. Inventario necesita SIEMPRE una tienda específica (a diferencia de "todas las tiendas" en el resto del dashboard), pero Finanzas sí debe poder cambiar entre tiendas.
- **`features/inventory/`** (nuevo): `types/inventory.types.ts`, `api/inventory.api.ts` (GET/PUT `/inventory/stores/:posConfigId/items`), `hooks/use-inventory-items.ts`, `hooks/use-upsert-inventory-bulk.ts`, `components/inventory-table.tsx` (tabla editable con buscador, guardado en lote con botón "Guardar cambios", tarjetas en mobile — mismo criterio responsive que `UsersTable`), `components/inventory-view.tsx` (composición: `StoreSelect` + `ExportExcelButton` + tabla, autoselecciona la primera tienda activa).
- **`app/dashboard/inventario/page.tsx`**: reemplaza el placeholder — ahora renderiza `<InventoryView />`. Sin filtro de fecha: esto es una foto del estado actual, no un reporte por rango.
- **`app/dashboard/layout.tsx`**: el ítem "Inventario" del sidebar pasa de "sin moduleKey, visible para cualquier rol" a `roles: ["SUPER_ADMIN", "FINANZAS"]` + `moduleKey: "dashboard.inventario"` — mismo patrón que "Cierre del mes".
- **`features/permissions/types/permissions.types.ts`** y **`features/permissions/constants/module-groups.ts`**: se agregó `dashboard.inventario` (label "Inventario", ícono `Warehouse`, grupo "Otros" junto a "Cierre del mes") para que el panel de Permisos lo incluya.

## Razones del cambio

- Se guarda en LOTE (no autosave por fila) porque el catálogo completo de Odoo puede ser largo — un autosave por tecla dispararía demasiadas peticiones. Mismo criterio que `GrowthPercentModal`/`UpsertGoalsBulk`.
- `quantity: null` (input vacío, placeholder "Sin contar") se distingue explícitamente de `0` — un producto sin contar todavía no es lo mismo que "se contó y no hay existencia".
- Se agregó `hideAllStoresOption` a `StoreSelect` en vez de duplicar el componente, porque el resto del selector (búsqueda de tienda, loading state, icono) es idéntico — solo cambiaba qué opción ocultar.
- Se restringió el nav a SUPER_ADMIN/FINANZAS porque el usuario confirmó que la captura es centralizada (Vendedor no participa en este tramo) — evita mostrar un ítem de menú que llevaría a un 403.

## Resultado final

`npx tsc --noEmit` y `npx eslint` sobre todos los archivos tocados: sin errores. `npm run build` no se pudo completar en esta sesión (Turbopack intenta bajar las fuentes de Google Fonts y la red de esta sesión las bloquea — sin relación con este cambio, mismo tipo de restricción de red ya documentado en sesiones anteriores para GitHub/npm/Odoo).

## Pendiente

- Vendedor podrá entrar en un tramo futuro (recepción/confirmación de envíos) — por ahora la vista es exclusiva de Finanzas/Super admin.
- Mermas, regalías, envíos planta→tienda y Kardex quedan para tramos posteriores.


## Ajuste same-day: botón "Traer inventario" + confirmación antes de guardar

Feedback del usuario tras revisar la primera versión (mismo día):

1. La carga del catálogo NO debía ser automática al elegir tienda — se verificó con AskUserQuestion y se confirmó: Finanzas debe presionar un botón "Traer inventario" a propósito.
2. Guardar cambios debe pasar siempre por un panel de confirmación antes de mandar el PUT.
3. Se reconfirmó que Vendedor no debe ver esta vista todavía — ya estaba resuelto en la primera versión (roles + moduleKey en el nav, `@Roles(SUPER_ADMIN, FINANZAS)` en el backend) y es el MISMO mecanismo que usa el resto del dashboard para pantallas restringidas (ej. Venta mensual, Cierre del mes): no hay guard de ruta del lado del cliente en ningún módulo de este proyecto, solo se oculta el ítem del sidebar y el backend rechaza la petición — no se agregó nada nuevo porque ya es consistente con ese patrón.

Cambios:
- **`features/inventory/hooks/use-inventory-items.ts`**: nuevo parámetro `enabled` — la consulta ya no se dispara automáticamente al tener `posConfigId`, sino solo cuando `InventoryView` lo autoriza.
- **`features/inventory/components/inventory-view.tsx`**: nuevo botón "Traer inventario" (icono `Download`) junto al `StoreSelect`. Antes de presionarlo se muestra un placeholder invitando a hacerlo. Cambiar de tienda reinicia el estado (`shouldFetch`) — hay que volver a traer el catálogo de la nueva tienda. Ya trayendo una vez, el mismo botón pasa a decir "Actualizar inventario" y permite refrescar (`refetch()`).
- **`features/inventory/components/inventory-table.tsx`**: "Guardar cambios" ya no llama el PUT directo — abre un `ConfirmSaveDialog` (mismo patrón visual que `CreateUserModal`/`GrowthPercentModal`: éxito visible antes de auto-cerrarse, error inline sin cerrar para reintentar) con la lista de productos y su nueva cantidad, y el PUT solo se dispara al presionar "Confirmar guardado" ahí dentro.

Sin cambios en xoco-api — los endpoints `GET/PUT /inventory/stores/:posConfigId/items` no cambiaron, solo cuándo/cómo el frontend los llama.

`npx tsc --noEmit` y `npx eslint` sobre los archivos tocados: sin errores.
