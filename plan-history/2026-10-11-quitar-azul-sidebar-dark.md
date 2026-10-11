# Quitar el azul del sidebar en modo oscuro

## Objetivo
El nombre "Xocolatísimo" del sidebar se veía azul en dark.

## Cambios realizados
- `app/globals.css`: en `.dark`, `--sidebar-primary` pasó del azul de shadcn (`oklch(0.488 0.243 264.376)`) a neutro claro (`oklch(0.985 0 0)`) y `--sidebar-primary-foreground` a oscuro, igual de neutro que en modo claro. También afecta al tinte del hover de los ítems del menú (ya no azulado).

## Resultado final
En dark el nombre y los hovers del sidebar son neutros.
