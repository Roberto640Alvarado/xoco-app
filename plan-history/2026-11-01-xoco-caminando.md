# Xoco caminando: animación de inicio de sesión y carga

## Objetivo
Una animación más bonita para "Iniciando sesión en Xocolatísimo" y para las cargas: una tableta de chocolate con el logo, caminando.

## Cambios realizados
- `ChocolateWalker` (design-system): tableta de chocolate con relieve, logo de Xocolatísimo, envoltura dorada, ojos que parpadean, cachetes, brazos y piernas que caminan, rebote al dar el paso, sombra, piso que avanza y gotita que cae. Keyframes `walker-*` en globals.css; quieta con prefers-reduced-motion.
- `LoginOverlay` usa `ChocolateWalker`. `ChocolateLoader` (arranque del panel, cambio de sección, Administración, Inventario, Permisos, página no encontrada) ahora muestra a Xoco caminando con la misma API.
- README y showcase actualizados.

## Razones
Pedido del usuario.

## Resultado final
Una sola mascota animada para iniciar sesión y para las cargas.

## Actualización: más animado y más "tableta"
- Rediseño: tableta con cuadritos en relieve (bisel de luz y sombra), mordida en la esquina con migas que caen, envoltura dorada con borde rasgado, brillo que la cruza y el logo impreso en la envoltura.
- Más animación: paso más rápido, se estira y se aplasta, se balancea, piernas y brazos con más recorrido, saluda cada pocos pasos (abre la boca), mira a los lados, líneas de velocidad detrás.
