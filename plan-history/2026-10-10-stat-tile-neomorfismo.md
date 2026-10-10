# StatTile: rediseño neomórfico con ícono

## Objetivo

El usuario pidió copiar el diseño de un componente de referencia ("neomorphism-metric-card") para "las tarjetas con números" en los módulos de Tráfico (Visitas, Tráfico de tiendas, Tráfico diario), Ventas (Resumen, Venta mensual, Venta diaria, Formas de pago), Mayoreo (Ventas mayoreo) y Tickets (Ticket promedio, Ticket detallado).

## Investigación previa

Las "tarjetas con números" de todos esos módulos resultaron ser un único componente compartido: `components/ui/stat-tile.tsx` (`StatTile`), usado en los 10 lugares exactos que cubre el pedido — así que el cambio se hizo en un solo componente y se propagó solo.

El componente de referencia incluía, además del estilo visual, un ícono circular y una flecha de tendencia (+13% vs mes anterior). Se preguntó al usuario qué tanto quería copiar, porque hoy no existe en el backend ningún cálculo de "comparado con el período anterior" para ninguna de estas métricas — el usuario confirmó: estilo + un ícono por tarjeta, sin flecha de tendencia.

## Cambios realizados

- **`components/ui/stat-tile.tsx`**: nuevo prop opcional `icon?: LucideIcon`. La tarjeta pasó de `rounded-xl border border-border bg-card p-4` a un estilo neomórfico: `rounded-3xl bg-muted` con una sombra de dos tonos (`shadow-[6px_6px_14px_rgba(0,0,0,0.07),-6px_-6px_14px_rgba(255,255,255,0.8)]`, con su variante `dark:`) que da el efecto "soft UI" de extruido. El ícono (cuando se pasa) se muestra a la derecha, dentro de un círculo con sombra interior (recesado) del mismo tono. Se agregó `whileHover={{ scale: 1.02 }}` de `framer-motion` (ya usado en el proyecto) para el micro-feedback al pasar el mouse, igual que en el componente de referencia.
- Se agregó un `icon` a cada uno de los 10 `<StatTile>` existentes, eligiendo un ícono de `lucide-react` por significado de la métrica: `DollarSign`/`Wallet`/`Receipt`/`Calculator` para dinero e impuestos, `Users` para visitas, `Banknote`/`CreditCard` para formas de pago, `Target` para "cumplimiento"/"meta del mes", `CheckCircle2` para "alcance de meta".

## Razones del cambio

- **Por qué `bg-muted` y no el gris de la referencia (`#e0e5ec`/`#2a2d32`)**: el efecto neomórfico depende de que el fondo de la tarjeta tenga margen para aclararse (resalte) Y oscurecerse (sombra) a la vez. El fondo del dashboard es blanco puro en modo claro (`--background: oklch(1 0 0)`), así que un resalte más claro que blanco puro es imposible de ver — por eso la referencia usa un gris-azulado como fondo de PÁGINA completa. En vez de cambiar el fondo de todo el dashboard (un cambio mucho más grande de lo pedido), se usó `--muted` — el tono gris sutil que el proyecto ya usa para superficies ligeramente elevadas (el mismo del badge del logo en el sidebar y en el login) — como fondo de la tarjeta únicamente. Así se logra el efecto "soft UI" sin tocar el resto de la paleta.
- **Por qué no se agregó flecha de tendencia**: requeriría calcular, para cada una de las 10 métricas, una comparación contra el período anterior — trabajo de backend no trivial que el usuario confirmó que no quería hacer en este pase (ver pregunta de alcance).
- **Por qué el ícono es opcional en el tipo (`icon?`) y no obligatorio**: por compatibilidad hacia adelante — si en el futuro aparece un `StatTile` sin ícono asignado, el componente sigue funcionando (solo omite el círculo) en vez de romper.

## Resultado final

`npx tsc --noEmit` y `npx eslint` sobre los 11 archivos tocados: sin errores. Se verificó visualmente el diseño final (tarjeta + ícono) en claro y oscuro con los colores reales de `--muted` del proyecto — el efecto de sombra se nota bien en ambos modos.
