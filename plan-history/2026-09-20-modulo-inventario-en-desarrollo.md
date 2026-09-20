# Nueva sección "Inventario" (placeholder)

## Objetivo

Dejar reservado un nuevo módulo "Inventario" en el sidebar, con los filtros generales del dashboard ya montados, mientras se define/implementa el reporte real.

## Cambios realizados

- `app/dashboard/layout.tsx`: nuevo item directo "Inventario" (icono `Warehouse`) después de "Cierre del mes". Sin `moduleKey` ni `roles` — visible para cualquier rol autenticado, igual que "Administración" (que tampoco tiene `moduleKey`). No se tocó el catálogo de RBAC (`features/permissions/types/permissions.types.ts`, `features/permissions/constants/module-groups.ts`, ni su espejo en xoco-api `src/common/constants/module-keys.const.ts`) porque el módulo todavía no expone ningún dato propio que ese panel tenga que gatear.
- `app/dashboard/inventario/page.tsx` (nuevo): monta `SalesFiltersBar` (fecha + tienda, con el mismo lock a la tienda propia para Vendedor que ya usa el resto del dashboard) y debajo un bloque "En desarrollo..." con el mismo estilo que los estados vacíos de otras páginas (ej. "Sin ventas en el rango seleccionado" de Categorías).

## Razones del cambio

- Reusar `SalesFiltersBar` en vez de armar un filtro nuevo evita duplicar lógica de fecha/tienda (incluyendo el lock de Vendedor) y deja la página lista para que, cuando se implemente el reporte real, solo haga falta conectar un hook de datos — el layout de filtros ya está.
- No se le dio `moduleKey` a propósito: agregarlo implica sincronizar 4 archivos (2 en cada repo) más el script de backfill de Prisma, solo para un módulo que todavía no tiene nada que mostrar. Se deja anotado en el código para agregarlo cuando el reporte esté listo, si se decide que también debe pasar por el panel de Permisos.

## Resultado final

`npx tsc --noEmit` y `npx eslint` sin errores en los archivos tocados.
