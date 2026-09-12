# Reportes vacíos: endpoints de la API sin publicar + estado de error en las gráficas

## Objetivo

El usuario reportó que "Mejores productos" (granel y comparación mensual),
"Categorías" y "Efectivo y otros medios" no mostraban datos, y que "Ventas
mayoreo" no devolvía nada con el error
`Cannot GET /wholesale-goals/summary?year=2026&month=9`.

## Diagnóstico

La causa estaba en `xoco-api`, no en el frontend. Probando contra la API
corriendo en `:4005` (las rutas existentes responden `401`, las
inexistentes `404`), estos 8 endpoints daban 404:

- `/sales/top-products-by-weight`
- `/sales/top-products-by-category`
- `/sales/payment-methods`
- `/sales/product-monthly-comparison`
- `/sales/customers/search`
- `/sales/by-wholesale-client`
- `/wholesale-goals/summary`, `/wholesale-goals/clients`

No era una build vieja ni faltaba implementarlos: **el trabajo existía
completo en la rama `visitas-y-venta-desde-facturas` de `xoco-api`** (4
commits, 52 archivos, ~3900 líneas, con tests y plan-history), pero el
repo local estaba en `main`, que no los tenía. Eso explica también por qué
el plan-history de este repo mencionaba "la entrada gemela en xoco-api"
que no aparecía en `main`.

## Cambios realizados

### En `xoco-api`

- `git merge --ff-only visitas-y-venta-desde-facturas` sobre `main`
  (fast-forward: `main` estaba estrictamente detrás, sin divergencia).
  Trae los 8 endpoints, el módulo `wholesale-goals` (con su modelo
  `WholesaleClientGoal` en Prisma) y el cambio de contar visitas/venta
  desde las facturas de Odoo.
- `npx prisma generate` y `npx prisma db push` — la base ya estaba en sync
  con el schema, no hizo falta migrar nada.
- Verificado: `npm test` (53 tests, 7 archivos) y `npm run build` limpios;
  los 8 endpoints pasaron de `404` a `401` (existen y piden auth).
  El servidor corre con `nest start --watch`, así que se reconstruyó solo.
- No se escribió código nuevo aquí: los contratos de respuesta
  (`sales.doc.ts`, `wholesale-goals.doc.ts`) se compararon campo por campo
  contra los tipos del frontend y ya coincidían.

### En este repo (frontend)

Las gráficas solo recibían `isLoading`, así que un request fallido caía en
el estado vacío y se leía como "no hubo ventas en el rango" — fue lo que
hizo que el problema pareciera de datos y no de API.

- `components/ui/chart-error-state.tsx` (NUEVO): estado de error con la
  misma altura (`h-64`) que el estado vacío y el skeleton, con el mismo
  texto que ya usan las tablas (`No se pudo cargar: <message>`).
- Las 6 gráficas (`components/charts/*`) aceptan `errorMessage` y lo
  muestran entre el skeleton y el estado vacío.
- `components/ui/stat-tile.tsx`: nueva prop `isError` — muestra "—" en vez
  del `value`, porque las páginas calculan sus totales sobre un arreglo
  vacío y el tile anunciaba un `$0.00` que parecía dato real.
- Páginas conectadas: `dashboard/page.tsx` (Resumen), `visitas`,
  `productos`, `categorias` y `efectivo-otros-medios`. En `categorias` el
  error se muestra una sola vez (la página arma un bloque por categoría, y
  al fallar la query no hay ninguno al que pasarle la prop).

No se tocaron las gráficas/tablas de `features/*` (Venta Mensual, Ticket
Promedio, Ventas Mayoreo, Tráfico...): esas secciones ya mostraban el
error de su query, y es justamente por eso que Ventas Mayoreo sí reveló el
404 desde el principio.

## Resultado final

- `xoco-api`: 53 tests y build en verde; los endpoints ya responden.
- Frontend: `npm run lint` sin errores ni warnings y `npm run build`
  compila.
- Pendiente de confirmar por el usuario en pantalla: que las 4 vistas
  ahora traigan números y que cuadren con lo que espera el negocio (los
  ids de Odoo de los clientes de mayoreo están fijos en
  `src/sales/constants/wholesale-clients.const.ts` de la API).
