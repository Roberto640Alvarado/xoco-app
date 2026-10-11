# Permisos con vista previa de cada sección

## Objetivo
Que el Super admin sepa qué sección da o quita a un rol, con una vista previa e información de la sección, fácil de usar y de recorrer.

## Cambios realizados
- Permisos pasa a lista y detalle: a la izquierda las secciones agrupadas como el menú (con insignia "Con acceso" u "Oculto" y el interruptor); a la derecha el detalle de la sección elegida, fijo al desplazarse en pantallas grandes. En pantallas chicas el detalle va arriba y la vista se lleva hasta él al elegir.
- Resumen del rol: "Vendedor ve 12 de 15 secciones" con barra de progreso y filtro Todos, Con acceso y Ocultos; cada grupo muestra cuántas tiene.
- Detalle (`module-detail.tsx`): vista previa ilustrativa (`module-preview.tsx`, se atenúa con un candado si el rol no la ve), qué es, dónde aparece en el menú, lo que ve el rol, quién más la ve (Super admin, Finanzas y Vendedor), aviso de datos compartidos, botón "Dar acceso" o "Quitar acceso" (rojo) y "Ver pantalla real".
- La confirmación nombra al rol, la sección y el grupo del menú, y explica qué se pierde o se recupera.
- `constants/module-info.ts`: descripción, contenido y ruta de cada una de las 16 secciones.
- Tour de Permisos con 4 pasos (rol, resumen, lista, vista previa).

## Resultado final
`tsc` sin errores y `eslint` solo con los avisos previos.
