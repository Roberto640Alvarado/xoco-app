# Interruptor de tema sol / luna

## Objetivo

Cambiar el interruptor de modo claro/oscuro del header (el de cielo con nubes y estrellas) por un switch de pastilla con sol y luna.

## Cambios realizados

- `components/ui/theme-switch.tsx` (nuevo, `ThemeSwitch`): switch de origin-ui adaptado al proyecto. El proyecto usa shadcn sobre Base UI (`components.json` style `base-vega`), así que en vez de `@radix-ui/react-switch` usa `@base-ui/react/switch` y las variantes `data-checked` / `data-unchecked` (no `data-[state=…]`). No se instalaron dependencias nuevas ni se tocaron `components/ui/switch.tsx` ni `label.tsx`.
- `components/layout/theme-toggle.tsx`: usa `ThemeSwitch` (encendido = claro, se ve el sol; apagado = oscuro, se ve la luna).
- `design-system/README.md`: línea de `ThemeSwitch`.

## Razones del cambio

Pedido del usuario.

## Resultado final

El header muestra el switch sol/luna. `components/ui/sky-toggle.tsx` y sus estilos `theme-switch*` de `app/globals.css` quedan sin uso y se pueden borrar.
