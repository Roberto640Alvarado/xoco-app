# Animación de carga: mazorca de cacao en vez de "Xoco caminando"

## Objetivo

Reemplazar la tableta de chocolate caminando por una animación de carga más profesional, relacionada con el chocolate o el cacao.

## Cambios realizados

- `design-system/components/cacao-loader.tsx` (nuevo, `CacaoLoader`): SVG de una mazorca de cacao con contorno, surcos y tallo en tono chocolate (más claro en modo oscuro). Por dentro se llena de chocolate con una ola suave, se mantiene y se vacía, en bucle de 3.2 s, con una leve "respiración" de la mazorca. Keyframes propios dentro del componente; con `prefers-reduced-motion` queda quieta a medio llenar.
- `design-system/components/chocolate-loader.tsx`: usa `CacaoLoader` (misma API: `size`, `label`, `delayed`), con tamaños más compactos.
- `features/auth/components/login-overlay.tsx`: "Iniciando sesión en Xocolatísimo" con la mazorca.
- README y showcase del design system: `CacaoLoader` en lugar de `ChocolateWalker`.

## Razones del cambio

Pedido del usuario: la mascota caminando no se veía profesional.

## Resultado final

Todas las cargas de página completa y el inicio de sesión muestran la mazorca de cacao. `chocolate-walker.tsx` y sus keyframes `walker-*` de `globals.css` quedan sin uso y se pueden borrar.

## Actualización: tableta en vez de mazorca

- La mazorca no convenció (pedido del usuario: "mejor una tableta"). Nuevo `design-system/components/chocolate-bar-loader.tsx` (`ChocolateBarLoader`): tableta de 3 x 4 cuadritos en relieve que se encienden uno tras otro y se apagan, con un brillo diagonal que la cruza, en bucle de 2.6 s. Con `prefers-reduced-motion` queda quieta y completa.
- `ChocolateLoader`, `LoginOverlay`, README y showcase usan `ChocolateBarLoader`. `cacao-loader.tsx` queda sin uso y se puede borrar, igual que `chocolate-walker.tsx`.

## Actualización: la tableta como el empaque de Xocolatísimo

- Con la foto del empaque real, `ChocolateBarLoader` pasa a ser la tableta envuelta: envoltura blanca con mazorcas de cacao (amarillas, verdes, en línea y cortes rojos), sello redondo con `XocolatisimoMark` y "XOCOLATÍSIMO" en anillo, y etiqueta negra "CHOCOLATE · OSCURO / DARK · 85%".
- Animación: las mazorcas se dibujan una tras otra y se desvanecen (bucle de 3 s) y el anillo del sello gira despacio (12 s). Quieta y completa con `prefers-reduced-motion`.
- Tamaños de `ChocolateLoader` ajustados a la proporción de la tableta (60 x 100).
