# Dashboard con gráficas de ventas + administración del API key de Odoo

## Contexto

Con el login y la validación de rol ya funcionando, se conectó `/dashboard`
a los endpoints reales de `xoco-api` y se construyó la pantalla de
administración para que un `SUPER_ADMIN` pueda ingresar/rotar el API key de
Odoo y su duración desde el panel (antes solo era posible por script). Se
siguió la skill de `dataviz` del sistema para las gráficas: forma primero,
color al final, un solo hue de acento (no hace falta paleta categórica
porque cada gráfica es de una sola serie/magnitud, no de identidad).

## Diseño

### `features/sales/`

- `sales.api.ts` / hooks (`useStores`, `useDailySummary`, `useTopProducts`)
  sobre los 4 endpoints de `/sales/*`.
- `SalesFiltersBar` — presets de 7/30/90 días + inputs de fecha nativos +
  `Select` de tienda (shadcn `select`, instalado en esta sesión).
- `SalesStatTiles` — 3 stat tiles (ingresos del período, órdenes, ticket
  promedio) calculados client-side sobre el mismo `daily-summary` que
  alimenta la gráfica de tendencia (una sola fuente de verdad, sin pedirle
  al backend un endpoint de KPIs aparte).
- `SalesTrendChart` — `AreaChart` de recharts, serie única (sin caja de
  leyenda — el título ya dice qué se grafica), línea de 2px, relleno en
  gradiente ~10-20% de opacidad, grid horizontal hairline recesivo, tooltip
  custom con fecha larga + ingresos + órdenes. Incluye una tabla (`<details>`
  colapsable) con los mismos datos — vista de tabla siempre disponible,
  como pide la skill.
- `TopProductsChart` — `BarChart` horizontal (los nombres de producto no
  caben como ticks de eje X), barras del mismo color (es un ranking por
  magnitud, no identidad — no aplica paleta categórica), extremo redondeado,
  valor en la punta, con su propia tabla colapsable.
- Color: `--chart-1` en `app/globals.css` se cambió del gris por defecto de
  shadcn al azul secuencial validado por la skill de dataviz (`#2a78d6`
  claro / `#3987e5` oscuro) — único color usado en ambas gráficas, vía
  `var(--color-chart-1)` (el alias de Tailwind ya registrado por el tema).

### `features/odoo-config/`

- `useOdooConfig` (GET /odoo/config) + `useRotateOdooConfig` (PUT, invalida/actualiza la query al éxito).
- `app/dashboard/admin/odoo/page.tsx` — tarjeta de estado actual (key
  enmascarada, uid, duración, expiración con ícono de vencido/vigente) +
  formulario de rotación (`react-hook-form` + Zod, campo de key como
  `type="password"` para no dejarla en claro en pantalla).
- `app/dashboard/admin/page.tsx` — índice simple con el link a "Integración
  con Odoo" (el de "Usuarios" queda deshabilitado, placeholder para cuando
  exista el endpoint de alta de `FINANZAS`).

### Navegación

`app/dashboard/layout.tsx` ahora tiene una barra de navegación real
("Ventas" / "Administración", esta última solo visible para `SUPER_ADMIN`)
en vez de ser solo un header con el logout — así el `SUPER_ADMIN` llega a
los módulos de ventas/finanzas (que comparte con `FINANZAS`) y a
administración desde el mismo panel, sin una sección separada.

## Verificación en vivo

`npm run build` (Turbopack + TypeScript) y `npm run lint` — 0 errores (el
único warning es el preexistente e intencional del fallback de
`window.location.href`).

Con ambos servidores reales corriendo a la vez (mismo patrón de una sola
invocación de shell) y sesión real de `SUPER_ADMIN`:
- `GET /dashboard` → 200.
- `GET /dashboard/admin` → 200.
- `GET /dashboard/admin/odoo` → 200.
- Sin errores en el log del servidor (SSR limpio).

Los datos que consumen las gráficas (`/sales/daily-summary`, `/sales/stores`,
`/sales/top-products`) ya se verificaron con datos reales de Odoo en el
plan-history correspondiente de `xoco-api` — no se repite aquí.

## Pendiente / limitaciones de esta verificación

- No se pudo tomar una captura real del navegador para revisar el
  renderizado visual de las gráficas: el puente remoto a tu Mac no deja
  correr un servidor de larga duración entre llamadas separadas (cada
  invocación es un shell nuevo), así que un navegador aparte no puede
  apuntarle a él. La verificación se apoyó en el build con TypeScript
  (tipos correctos en los props de recharts/Select) + revisión manual del
  código contra la skill de dataviz. Vale la pena que la revises tú
  visualmente (`npm run dev` en tu Terminal) por si algo se ve distinto a
  lo esperado.
- Sigue sin existir un usuario `FINANZAS` para confirmar en vivo que
  `/dashboard/admin` le queda bloqueado por el middleware.
