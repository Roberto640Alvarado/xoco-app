# Nuevo módulo "Cierre del mes"

## Contexto

El usuario mandó 2 capturas de la hoja "CIERRE DE MES" del Excel original: 3 secciones apiladas (Tráfico / Venta / Ticket), cada una con las MISMAS 5 columnas — `[mes anterior]`, `Cierre [mes actual]`, `Crecimiento o decrecimiento vs [mes anterior]` (en rojo si es negativo, verde si es positivo), `Meta`, `Alcance`. La barra de fórmulas de la segunda captura confirmó `Alcance = Cierre-mes-actual / Meta` (`=B6/D6`).

Pedido textual: "practicmante es el total del mes anterior al actual, el que se seleccione, El trafico del mes anterior vs el actual / Ventas y ticket promedio igual / y las metas respectivas y el alcance".

No se hizo `AskUserQuestion` para este módulo — se resolvieron las ambigüedades con la evidencia ya disponible (capturas + patrón establecido en los 3 módulos de metas ya construidos), en vez de bloquear en preguntas:

- **Un solo selector de mes** ("el que se seleccione") mueve las 3 secciones a la vez — mismo patrón "mes ancla" que el resto de módulos.
- **`[mes anterior]` = mes seleccionado − 1**, `Cierre [mes actual]` = mes seleccionado — coincide exactamente con el par Junio/Cierre-Julio de la captura.
- **Meta y Alcance = las mismas ya configuradas** en Tráfico de tiendas / Venta Mensual / Ticket Promedio para el mes seleccionado — así lo dice "las metas respectivas" (no hay un cuarto % de crecimiento nuevo que configurar en este módulo).
- **Una sola fila de totales por sección** (no por tienda) — así se ve en la captura, y tiene sentido como resumen ejecutivo sobre los 3 módulos que sí desglosan por tienda.
- **Sin gráfica ni tarjeta** — el usuario solo pidió "estas tablas", a diferencia de todos los módulos anteriores donde sí pidió explícitamente "tarjeta" y "gráfica".

## Diseño

**Sin cambios en xoco-api ni en los otros módulos** — "Cierre del mes" es de solo lectura y reutiliza directamente los hooks ya existentes de los 3 módulos de metas:

- `useGoalsSummary(year, month)` (Tráfico) — el mes ancla YA trae `previousMonthActualOrders` por tienda en la misma respuesta, así que Tráfico necesita una sola llamada.
- `useSalesGoalsSummary(year, month)` (Venta) y `useTicketGoalsSummary(year, month)` (Ticket) NO traen el mes anterior en su respuesta (a diferencia de Goals) — se piden dos veces cada uno, una para el mes ancla y otra para el mes ancla−1, y se toma `actualRevenue`/`actualAverageTicket` de la respuesta del mes anterior como su total.

Esto es una excepción deliberada a la convención de "familias autocontenidas" (Tráfico Diario/Venta Diaria/Ticket Detallado no comparten código entre sí a propósito): acá SÍ se importan los hooks de Goals/SalesGoals/TicketGoals directamente, porque este módulo depende A PROPÓSITO de esos 3 — es un rollup sobre "las metas respectivas", nunca debe poder desalinearse de lo que esos 3 módulos ya calculan.

**`features/cierre-mes/lib/aggregate.ts`** — funciones puras: `sumOrNull` (Tráfico/Venta, se suma entre tiendas), `averageOrNull` (Ticket, promedio simple entre tiendas — mismo mecanismo que la fila "Promedio" de Ticket Promedio, nunca se suma un ticket promedio), `divideOrNull`, `growthOrNull` ((cierre − anterior) / anterior, `null` si el mes anterior fue 0 o no hay dato) y `buildSection()` que arma el objeto de 5 campos de una sección a partir de esos 3 totales.

**`features/cierre-mes/components/month-close-section.tsx`** — tabla de una sola sección (una fila de datos), recibe los 5 valores ya calculados + una función `formatValue` (para que Tráfico use enteros y Venta/Ticket usen moneda). El color de "Crecimiento o decrecimiento" es rojo (`text-destructive`) si es negativo y verde (`text-emerald-600`/`dark:text-emerald-400` — no existía un token "success" en el proyecto) si es positivo.

**`features/cierre-mes/components/month-close-view.tsx`** — navegador de mes (mismo patrón que los demás módulos, sin botón de "Configurar %" porque este módulo no tiene un % propio que configurar) + las 3 secciones (Tráfico con `formatInteger`, Venta y Ticket Promedio con `formatCurrency`).

**`app/dashboard/layout.tsx`**: se agregó "Cierre del mes" al sidebar, justo después de "Ticket Detallado" (al final de los 6 módulos de metas/detalle, antes de "Ventas") — orden elegido por ser el resumen que cierra ese grupo.

## Verificación

- `npm run lint` y `npm run build`: limpios (el único warning es el preexistente de `lib/api/client.ts`, sin relación).
- No se verificó en vivo contra datos reales de Mongo/Odoo en esta sesión — a diferencia de los módulos de metas (Goals/SalesGoals/TicketGoals), que sí se probaron con un script temporal contra la base real, este módulo no tiene lógica de backend nueva que verificar: solo agrega/promedia campos que esos 3 endpoints ya devuelven y que ya están probados.

## Pendiente

- El usuario debe revisar la UI en vivo (colores de Crecimiento/decrecimiento, si el orden Tráfico/Venta/Ticket es el que espera, si el nombre "Cierre del mes" en el sidebar está bien) y confirmar si de verdad no quiere gráfica/tarjeta aquí, ya que fue una inferencia (no se preguntó explícitamente) a partir de que el pedido solo mencionó "estas tablas".
- Nada pendiente del lado del backend.
