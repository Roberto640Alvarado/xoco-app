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


## Ajuste same-day: existencia de Odoo como referencia (odooQuantity)

Mismo cambio que el plan-history hermano en xoco-api. En el frontend:

- **`features/inventory/types/inventory.types.ts`**: `InventoryItem` gana `odooQuantity: number | null`.
- **`features/inventory/components/inventory-table.tsx`**: cada vez que llega un lote nuevo de `items` (primer "Traer inventario" o un refetch), se precarga como draft el `odooQuantity` de los productos que todavía no tienen `quantity` guardada — Finanzas ve el número de Odoo ya puesto en el input, con la nota "Sugerido por Odoo — verifica" debajo, y lo ajusta o lo deja tal cual antes de guardar. No se pisa un draft que el usuario ya haya tocado.
- **`features/inventory/components/inventory-view.tsx`**: el Excel exportado ahora incluye la columna "Existencia Odoo (referencia)".

## Razones del cambio

- La sugerencia se guarda como un draft "sucio" (no solo se muestra) para que quede incluida en el panel de confirmación y se guarde si Finanzas no la toca — "que solo la ajuste" implica que aceptar el número tal cual, sin escribir nada, también debe poder guardarse.
- No se sobrescribe un producto que YA tiene `quantity` guardada (aunque Odoo reporte un número distinto) — la captura manual sigue siendo la fuente de verdad una vez que existe; `odooQuantity` solo sirve de arranque para lo que nunca se ha contado.

## Resultado final

`npx tsc --noEmit` y `npx eslint` sobre los archivos tocados: sin errores.


## Ajuste same-day: 2 columnas (índice Odoo / inventario nuevo) + carga automática

Feedback del usuario tras probar el flujo de "Traer inventario": pidió separar en dos inputs — "Índice inicial" (lo que reporta Odoo) al lado de "Inventario nuevo" (la captura real) — y que el catálogo ya salga cargado al entrar/elegir tienda, dejando el botón solo para actualizar/refrescar la lista.

Esto revierte el gate de la ronda anterior ("Traer inventario" bloqueaba la carga hasta presionarlo) y reemplaza el precargado de `odooQuantity` dentro del mismo input (ronda anterior) por dos columnas separadas.

Cambios:
- **`features/inventory/hooks/use-inventory-items.ts`**: se quita el parámetro `enabled` — la consulta vuelve a dispararse automáticamente en cuanto hay `posConfigId` (mismo criterio que el resto del dashboard). El botón de `InventoryView` ya no gatea la carga inicial, solo dispara un `refetch()` manual.
- **`features/inventory/components/inventory-view.tsx`**: se quita el estado `shouldFetch`/`lastPosConfigId` y el placeholder "presiona para traer". El botón cambia de "Traer inventario" (ícono `Download`) a "Actualizar inventario" (ícono `RefreshCw`), siempre habilitado con tienda seleccionada, y llama `inventory.refetch()`. El placeholder solo se muestra cuando no hay ninguna tienda seleccionada todavía. El Excel exportado ahora usa los encabezados "Índice inicial (Odoo)" e "Inventario nuevo" en vez de una sola columna "Existencia Odoo (referencia)".
- **`features/inventory/components/inventory-table.tsx`**: se quita por completo el precargado de drafts con `odooQuantity` (y la nota "Sugerido por Odoo — verifica") de la ronda anterior. La celda de cantidad se separa en dos componentes: `OdooIndexBox` (input deshabilitado, de solo lectura, muestra `item.odooQuantity` o "—") y `NewQuantityInput` (el input editable de siempre, el que se guarda). La tabla de escritorio pasa de 4 a 5 columnas (se agrega "Índice inicial" junto a "Inventario nuevo", cada una con un subtítulo pequeño — "Odoo · referencia" / "se guarda esto"); en mobile las tarjetas muestran ambos valores lado a lado con etiquetas cortas.

Sin cambios en xoco-api — mismos endpoints, mismos datos; solo cambia cómo se presentan y cuándo se cargan en el frontend.

## Razones del cambio

- Separar en dos columnas en vez de precargar el draft evita ambigüedad entre "lo que dice Odoo" y "lo que Finanzas realmente contó" — antes un número sin tocar podía confundirse con una captura real ya hecha.
- Volver a la carga automática iguala el comportamiento de Inventario con el resto del dashboard (ninguna otra vista pide un clic extra solo para ver los datos) — el botón ahora sirve para su propósito más útil en la práctica: refrescar cuando Odoo cambió después de la primera carga.

## Resultado final

`npx tsc --noEmit -p tsconfig.json` y `npx eslint features/inventory` sobre los tres archivos tocados: sin errores. **`odooQuantity` sigue sin verificarse contra el Odoo real del negocio** — esta sesión no tiene salida de red hacia `xocolatisimo.odoo.com`, así que falta que Finanzas confirme en producción que el número de "Índice inicial" coincide con lo que Odoo realmente reporta por tienda.


## Ajuste same-day: aviso "en desarrollo" + hallazgo del índice de Odoo

Se corrió `scripts/inspect-odoo-stock.mjs` contra el Odoo real del negocio y se confirmó por qué "Índice inicial (Odoo)" salía igual en varias tiendas: San Benito, Tienda Ramblas y Sucursal Escalon SÍ tienen su propia bodega (`stock.warehouse`) creada en Odoo, pero sus Puntos de Venta están mal configurados y apuntan los tres a la bodega "Plaza Centrika" en vez de a la suya — no es un bug de la app, es una configuración a corregir directo en Odoo (Punto de Venta → Configuración → cada tienda → campo Almacén). Los movimientos de venta (`stock.move.line`) sí descuentan de la ubicación correcta de cada tienda, así que la operación diaria no está afectada — solo el número de referencia que mostramos.

Mientras se corrige eso en Odoo, se agregó un aviso visible en la vista para que quien la vea (Admin/Finanzas, ya restringido) sepa que el módulo sigue en desarrollo:

- **`components/ui/in-development-banner.tsx`** (nuevo, reutilizable para futuros tramos): banner con ícono de construcción y mensaje configurable.
- **`features/inventory/components/inventory-view.tsx`**: se agrega el banner arriba de todo, con un mensaje específico sobre el índice de Odoo mientras se corrige la configuración de bodegas.

Sin cambios de permisos — Inventario ya estaba restringido a `SUPER_ADMIN`/`FINANZAS` desde la primera versión (nav + backend), se confirmó que sigue así.

## Resultado final

`npx tsc --noEmit -p tsconfig.json` y `npx eslint features/inventory components/ui/in-development-banner.tsx`: sin errores.
