# Animación de chocolate al cargar

## Objetivo
Una animación de carga con tema de chocolate para las esperas de página completa.

## Cambios realizados
- Nuevo `ChocolateLoader` (`design-system/components/chocolate-loader.tsx`): barra de chocolate cuyos cuadros aparecen en ola, destello que la cruza, gotas que caen y un charco con onda. Tamaños sm, md y lg, texto opcional y `delayed` para evitar el parpadeo en cargas rápidas. Colores propios para modo claro y oscuro; respeta `prefers-reduced-motion`. Los keyframes están en `app/globals.css` (clases `choco-*`).
- Se usa en el arranque del panel (hidratación de sesión), el cambio de sección (`app/dashboard/loading.tsx`), las guardas de Administración y de Inventario, la carga de Permisos y la página 404 mientras valida la sesión.
- Catálogo: ejemplo en el showcase y entrada en el README. Las tablas y gráficas conservan sus esqueletos y los botones su ícono giratorio.

## Resultado final
`tsc` sin errores y `eslint` solo con los avisos previos. La animación se revisó con capturas en modo claro y oscuro.
