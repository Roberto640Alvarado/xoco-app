# Sidebar con el estilo de la referencia

## Objetivo
Darle al sidebar el diseño de la referencia que mandó el usuario (dashboard-sidebar): bloque de marca arriba, "Buscar" con ⌘K, filas compactas, submenús con flecha y línea guía, y un pie separado.

## Cambios realizados
- Se mantuvo el sidebar de shadcn (cajón en celular, colapsable a íconos, permisos, avisos) y se cambió solo el estilo en `dashboard-shell.tsx`: filas de 13px con íconos finos, activo con fondo tenue, flecha a la derecha que gira, hijos con ícono y línea guía, encabezados de sección en mayúsculas tenues, avisos como píldora.
- Arriba: logo + "Xocolatísimo" + rol del usuario.
- Nuevo `components/layout/nav-search.tsx`: buscador de pantallas (⌘K / Ctrl+K, flechas y Enter) con las secciones que el usuario puede ver.
- Abajo: "Salir" y la tarjeta del usuario (nombre y correo), separados con una línea.
- Barra superior: ruta tipo "Inventario / Kardex" y el interruptor de tema a la derecha.

## Razones
No se copió el componente tal cual porque usa datos de ejemplo, no navega con rutas reales, no filtra por rol/permisos y no tiene versión móvil; se trasladó su diseño al sidebar existente.

## Resultado final
Mismo menú y permisos, con el nuevo diseño y buscador.

## Actualización: menú del usuario
- `components/layout/user-menu.tsx`: el pie del sidebar es un solo botón (foto, nombre y rol con color) que abre un menú con correo, rol, tienda del Vendedor, Inicio, Administración (Super admin), interruptor de modo oscuro y Cerrar sesión en rojo. Con el sidebar colapsado queda solo la foto y el menú abre a la derecha.
