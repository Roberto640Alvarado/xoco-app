# Odoo: uid por defecto, días restantes y botón primary

## Objetivo
Prellenar el uid de Odoo con 7, mostrar cuántos días faltan para que venza la API key y hacer primary el botón "Agregar API key".

## Cambios realizados
- El modal abre con uid 7 (y 30 días de duración).
- "Estado actual": la caja "Expira" suma "Quedan N días", "Vence hoy" o "Venció hace N días". El badge pasa a "Por vencer" (ámbar) cuando quedan 7 días o menos.
- "Agregar API key" pasa de secondary a primary (es la acción principal de la pantalla).

## Resultado final
`tsc` sin errores y `eslint` solo con los avisos previos.
