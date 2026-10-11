# Inicio de sesión con la tableta que se parte

## Objetivo
Al iniciar sesión, mostrar al instante "Iniciando sesión en Xocolatísimo" con una tableta de chocolate partiéndose.

## Cambios realizados
- Nuevo `ChocolateBreak` (`design-system/components/chocolate-break.tsx`): tableta de 4x3 cuadros que se parte por un borde irregular, se abre en V soltando migas y vuelve a unirse. Colores en modo claro y oscuro; quieta con `prefers-reduced-motion`.
- `LoginOverlay` (`features/auth/components/login-overlay.tsx`): pantalla completa con la tableta y el texto "Iniciando sesión en Xocolatísimo / Preparando tu panel...". Se muestra apenas se envía el formulario y se queda hasta que el panel abre (si el login falla, desaparece y se ve el error).
- Catálogo: ejemplo en el showcase y entrada en el README.

## Resultado final
`tsc` sin errores y `eslint` solo con los avisos previos. La animación se revisó con capturas en modo claro y oscuro.
