# Interruptor de tema en la esquina superior derecha

## Objetivo
Mover el cambio claro/oscuro del pie del sidebar a la esquina superior derecha, con el interruptor "cielo" (sol y nubes / luna y estrellas) que mandó el usuario.

## Cambios realizados
- `components/ui/sky-toggle.tsx`: el componente adaptado sin styled-components (estilos `theme-switch*` en `app/globals.css`), como checkbox real con `role="switch"`, foco visible con teclado y sin animación con prefers-reduced-motion.
- `ThemeToggle` usa `SkyToggle` sobre next-themes; se quitó del pie del sidebar y va en el header (`ml-auto`).

## Razones
Pedido del usuario. No se agregó styled-components para no sumar una dependencia por un solo componente.

## Resultado final
El interruptor queda arriba a la derecha en todas las pantallas del panel.
