# Panel de metas mensuales en la página de Visitas

## Contexto

Continuación de `2026-09-09-modulo-goals-metas-por-tienda.md` (xoco-api): el backend ya expone `GET /goals/summary?year=&month=` y `PUT /goals`. Este cambio agrega la UI correspondiente en `/dashboard/visitas`, debajo de la gráfica existente — sección "Metas por tienda" con meta editable, real, alcance y proyección de cierre.

## Diseño

- `features/goals/` (mismo patrón que `features/sales/` y `features/odoo-config/`): `types/goals.types.ts`, `api/goals.api.ts` (`fetchGoalsSummary`, `upsertGoal` — este último usa `apiClient.put` directo, igual que `rotateOdooConfig`, porque `lib/api/client.ts` todavía no tiene un helper `apiPut`), `hooks/use-goals-summary.ts` (react-query), `hooks/use-upsert-goal.ts` (mutation que invalida el query de resumen al guardar, en vez de intentar reconstruir Alcance/Proyección en el cliente — esos números los recalcula el backend).
- `features/goals/components/goals-panel.tsx` (`GoalsPanel`): navega por **mes calendario** (flechas anterior/siguiente, con el siguiente deshabilitado si cae en el futuro) — independiente del rango de fechas de `SalesFiltersBar` de arriba, que sigue controlando solo la gráfica diaria. Tabla con una fila por tienda (`GoalRow`): input numérico + botón de guardar (deshabilitado hasta que el valor cambia) para la meta, y columnas de solo lectura para Real, Alcance, Proyección y % proyectado — estas dos últimas muestran "—" en un mes ya cerrado (no aplica proyectar algo que ya pasó).
- Se agregó `formatPercent` a `lib/format.ts` (mismo patrón que `formatCurrency`/`formatInteger`): `0.0725 -> "7.3%"`, `null`/`undefined` (sin meta guardada) `-> "—"`.
- `app/dashboard/visitas/page.tsx`: se agregó `<GoalsPanel />` después de `<DailyTrendChart />`. No se tocó nada de la lógica existente de la página.

## Verificación

- `npm run lint` (ESLint): 0 errores (solo el warning preexistente y no relacionado de `window.location.href` en `lib/api/client.ts`).
- `npm run build`: compila limpio, TypeScript sin errores, y las 8 rutas reales siguen siendo `○ Static` (incluida `/dashboard/visitas`) — el nuevo panel no introdujo ninguna API dinámica de Next que forzara renderizado dinámico.
- El backend (`GET /goals/summary`, `PUT /goals`) se verificó funcionalmente contra datos reales del lado de xoco-api (ver su propio plan-history) — no se hizo una verificación visual en navegador de este panel en particular porque el servidor de desarrollo no sobrevive entre invocaciones separadas del bridge remoto (cada invocación es un shell nuevo); queda pendiente que el usuario lo revise en vivo.

## Pendiente

- Revisión visual en vivo por parte del usuario (capturas o acceso directo) para confirmar que el layout de la tabla se ve bien, sobre todo en pantallas angostas (tiene `overflow-x-auto` con un ancho mínimo de 560px para la tabla).
