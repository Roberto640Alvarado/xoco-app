# Nuevo módulo "Tráfico de tiendas" (reemplaza el panel de metas en Visitas)

## Contexto

El usuario mandó una captura de la hoja "Trafico de tiendas " del Excel original y pidió:

1. Un módulo NUEVO en el sidebar llamado "Tráfico de tiendas" (separado de "Visitas") que muestre esa tabla con los encabezados EXACTOS del Excel: "Visitas a la fecha", "Meta del mes", "Alcance", "Visitas faltantes a la fecha", "Visitas Diarias Necesarias", "Proyección cierre de mes", "%".
2. La fórmula real de "Meta del mes": `(Total del mes anterior * meta%) + Total del mes anterior` — ya no es un número fijo capturado a mano (como se había hecho en el panel anterior dentro de Visitas), sino que se deriva del total REAL de órdenes del mes anterior. Ver el rediseño correspondiente en xoco-api (`2026-09-09-goals-meta-derivada-de-porcentaje-crecimiento.md`).
3. "Visitas Diarias Necesarias" = la misma resta que "Visitas faltantes a la fecha" (tal cual, no una división por días restantes).
4. "Proyección cierre de mes" = (Visitas a la fecha / día del mes transcurrido) * días del mes — la proyección real por ritmo diario que ya se venía calculando.
5. El % de crecimiento se debe poder pedir cada mes, con la opción de aplicar el mismo % a todas las tiendas o uno distinto por tienda, en un modal con mejor diseño y que "se note" cuando se guardó.
6. Mantener el filtro/navegador de mes (le gustó como quedó).

Esto reemplaza por completo el panel de metas que se había agregado dentro de la página de Visitas en `2026-09-09-panel-de-metas-en-visitas.md` — se quitó de ahí y se movió a su propia página.

## Diseño

- Se instalaron los componentes shadcn `dialog` y `radio-group` (base-ui) que no existían todavía en el proyecto (`npx shadcn@latest add dialog radio-group -y`).
- `features/goals/` se reescribió para el nuevo contrato del backend (`growthPercent` en vez de `targetOrders`, endpoint de lote):
  - `types/goals.types.ts`: `GoalSummaryItem` con los campos nuevos (`growthPercent`, `previousMonthActualOrders`, `targetOrders`, `missingOrders`, `dailyNeededOrders`, además de los que ya existían); `UpsertGoalsBulkPayload` (`year`, `month`, `entries: [{posConfigId, growthPercent}]`).
  - `api/goals.api.ts` / `hooks/use-goals-summary.ts` (tipado con `ApiError` como en el fix anterior) / `hooks/use-upsert-goals-bulk.ts` (invalida el query de resumen al guardar).
  - `components/traffic-goals-table.tsx` (`TrafficGoalsTable`, reemplaza a `GoalsPanel`): navegador de mes (igual que antes) + botón "Configurar %" que abre el modal, tabla con una fila por tienda y una fila "Total Mensual" (sumas calculadas en el cliente — `sumOrNull` devuelve `null` si alguna tienda no tiene % guardado ese mes, para no mostrar un total engañoso). Los encabezados de columna son literalmente los que pidió el usuario, sin traducir ni renombrar.
  - `components/growth-percent-modal.tsx` (`GrowthPercentModal`): `RadioGroup` con dos modos — "Mismo % para todas las tiendas" (un solo input) y "% distinto por tienda" (un input por tienda, precargado con lo que ya tenía guardado cada una). Al guardar, manda `PUT /goals` con una entrada por tienda (todas con el mismo valor en modo "mismo %", o el valor propio de cada una en modo "distinto"). Para que "se note" que quedó guardado: al tener éxito, el modal cambia a un banner verde de confirmación y se cierra solo 1.2s después (en vez de cerrarse de inmediato) — el botón de guardar además pasa por sus tres estados (Guardar → Guardando... con spinner → Guardado con check) antes de eso.
  - El reset del formulario del modal al abrirse se resolvió sin `useEffect` (el lint del proyecto, `react-hooks/set-state-in-effect`, rechaza `setState` síncrono dentro de un efecto) — se usa el patrón que recomienda la documentación de React de "ajustar estado durante el render" con una bandera `wasOpen`, en vez de una condición dentro de `useEffect`.
- `app/dashboard/trafico-tiendas/page.tsx` (nueva ruta) renderiza `<TrafficGoalsTable />`.
- `app/dashboard/layout.tsx`: se agregó el ítem de nav "Tráfico de tiendas" (ícono `TrendingUp`) entre "Productos" y "Administración". No hizo falta tocar `middleware.ts` — ya trata cualquier prefijo `/dashboard/*` como ruta conocida.
- `app/dashboard/visitas/page.tsx`: se quitó `<GoalsPanel />` (y su import) — la vista de metas ya no vive ahí.
- Se borró `features/goals/components/goals-panel.tsx` y `features/goals/hooks/use-upsert-goal.ts` (superados por `traffic-goals-table.tsx`/`growth-percent-modal.tsx` y `use-upsert-goals-bulk.ts`).

## Verificación

- `npm run lint` (ESLint): 0 errores (solo el warning preexistente y no relacionado de `lib/api/client.ts`) — en el camino se corrigió un error real de `react-hooks/set-state-in-effect` en el modal y un warning de dependencias inestables en `TrafficGoalsTable` (un array `[]` nuevo en cada render como fallback de `summary.data`, reemplazado por una constante módulo-level).
- `npm run build`: compila limpio, TypeScript sin errores (se ajustó un `reduce` con generic explícito para que TS no infiera el acumulador como `number | null`), y las 9 rutas reales siguen siendo `○ Static`, incluida la nueva `/dashboard/trafico-tiendas`.
- El cálculo (Meta del mes, Alcance, faltantes, proyección) se verificó del lado de xoco-api contra datos reales de Odoo — ver su propio plan-history. No se hizo verificación visual en navegador de esta página en particular (mismo límite de siempre: el servidor de desarrollo no sobrevive entre invocaciones separadas del bridge remoto).

## Pendiente

- Revisión visual en vivo por parte del usuario, sobre todo del modal (los dos modos, el estado de confirmación) y de la fila "Total Mensual" cuando alguna tienda no tiene % guardado ese mes (debería mostrar "—" en vez de un total incompleto).
