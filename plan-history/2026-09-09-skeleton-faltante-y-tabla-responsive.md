# Skeleton faltante en Ventas/Visitas/Productos + tabla de Usuarios responsive

## Contexto

El usuario reportó 2 cosas después de ver la tabla de Usuarios rediseñada: (1) la tabla se veía "cortada", pidió que fuera responsive; (2) al revisar otros módulos, notó que Ventas, Productos y Visitas seguían sin skeleton/loading animado.

## Por qué faltaban esos 3

El barrido de skeletons de "skeletons-y-editar-usuario" solo recorrió `app/` y `features/` — `components/charts/daily-trend-chart.tsx` y `components/charts/product-ranking-chart.tsx` quedaron fuera porque viven en `components/`. Esos 2 componentes son los que alimentan:

- `/dashboard` (Ventas) y `/dashboard/visitas` — ambos usan `DailyTrendChart`.
- `/dashboard/productos` — usa `ProductRankingChart` (x2: más vendidos / menos vendidos).

Se corrigió igual que el resto: el `<div className="flex h-64 items-center justify-center...">Cargando...</div>` pasa a `<ChartSkeleton height={256} />`. Se volvió a correr `grep -rn "Cargando" --include="*.tsx" .` sobre todo el repo (no solo `app`/`features`) para confirmar que no quedara ningún otro caso — solo quedan los placeholders de `<SelectValue>` de las tiendas (texto dentro de un dropdown, no un bloque de contenido) y el contador de la cabecera de Usuarios, ambos dejados a propósito.

## Tabla de Usuarios cortada

Causa: la columna "Acciones" ahora tiene 2 botones con texto ("Editar", "Cambiar contraseña", agregados en el pedido anterior) + las columnas Usuario/Rol/Creado/Estado — en una pantalla angosta o con el contenedor limitado a `max-w-4xl`, la fila necesita más ancho del que cabe y la tabla dependía por completo del scroll horizontal (que ya tenía, mediante `overflow-x-auto` en `components/ui/table.tsx`) para no cortarse, pero sin ningún indicio visual de que hay más contenido a los lados se ve simplemente "roto".

Cambios en `features/users/components/users-table.tsx`:
- Columna "Creado" (la menos esencial) se oculta bajo `md` (`hidden md:table-cell` en header y celda).
- Los botones de Editar/Cambiar contraseña muestran el ícono siempre; el texto (`<span className="hidden sm:inline">`) solo aparece desde `sm` — en pantallas angostas quedan solo los íconos (con `aria-label`, igual que antes de agregarles texto), en pantallas normales se ve el texto completo como pidió el usuario.
- El contenedor de `flex` de los botones ahora puede envolver (`flex-wrap`) en vez de forzar una sola línea.

En `app/dashboard/admin/users/page.tsx`: el contenedor de la página pasa de `max-w-4xl` a `max-w-6xl` (más aire para la tabla en pantallas normales/grandes, para que dependa menos del scroll horizontal); `CreateUserForm` se envolvió en su propio `max-w-2xl` para que el formulario no se vea desproporcionadamente ancho ahora que la página creció.

## Verificación

`npm run lint` y `npm run build` limpios (mismo warning preexistente de siempre). Como en toda esta serie, no se pudo probar en vivo en el navegador en esta sesión.

## Pendiente

El usuario debe confirmar en vivo que la tabla ya no se vea cortada en su pantalla (la que mostró en la captura) y en móvil, y que Ventas/Visitas/Productos ahora muestren el skeleton animado mientras cargan.
