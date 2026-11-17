# Conteo: UI/UX más clara y captura rápida

## Objetivo

Que quien llena el Conteo entienda qué está haciendo (el conteo REEMPLAZA la cantidad, no suma) y pueda llenarlo rápido producto por producto.

## Cambios realizados

- `features/inventory/components/inventory-table.tsx`
  - Guía de 3 pasos arriba de la tabla (`HelpSteps`): ¿Cuándo contaron? → Escribe lo que hay → Revisa y guarda.
  - "Fecha del conteo" ahora usa `SegmentedControl` (Ahora / Otra fecha) dentro de una barra con los contadores y "Guardar cambios".
  - Aviso fijo: "Enter pasa al siguiente producto" y "si llegó producto de planta, regístralo como Entrada en Movimientos".
  - Columna "Inventario nuevo" → "Conteo físico" ("lo que hay hoy · reemplaza el anterior"). El campo arranca VACÍO con la existencia estimada como placeholder (antes venía lleno con el conteo viejo y parecía la cantidad actual).
  - Al escribir, la fila se resalta y sale la diferencia contra la estimada: Cuadra / Sobran X / Faltan X, más "Deshacer".
  - Botón "Usar estimada" por fila para copiar la estimada cuando cuadra.
  - Debajo de cada campo: "Último conteo: N · fecha · correo" (o "Nunca contado").
  - Teclado: Enter o ↓ al siguiente producto, Shift+Enter o ↑ al anterior; al final de la página va a "Guardar cambios". Se selecciona el número al enfocar y la rueda del mouse ya no cambia el valor.
  - Filtro nuevo en la columna: Escritos ahora / Sin escribir / Nunca contados / Por receta.
  - 50 filas por página por defecto.
  - Recontar con el mismo número que el conteo anterior ahora sí se guarda (reinicia la estimada desde esa hora); antes se descartaba como "sin cambio".
  - Panel de confirmación: "Estimada → Contado" con la diferencia por producto y "Cada cantidad reemplaza el conteo anterior".
  - Aviso del navegador al cerrar/recargar con conteos sin guardar.
- `design-system/components/data-table.tsx`: prop `getRowClassName` para resaltar filas. README actualizado.
- `features/inventory/components/inventory-view.tsx`: Excel con "Último conteo" y "Fecha del conteo" (`countedAt`) en vez de la fecha de guardado.
- `features/inventory-guide/content.ts`: textos del tour y de la pantalla con el nuevo nombre "Conteo físico".

## Razones del cambio

El equipo de Xocolatísimo no tenía claro si escribir 8 sobre un 5 daba 8 o 13, y llenar decenas de productos era lento (10 filas por página, sin navegación por teclado, sin saber si lo contado cuadraba).

## Resultado final

Sin cambios en xoco-api. La pantalla explica el flujo, muestra al momento si cada conteo cuadra con la estimada y se llena con el teclado sin tocar el mouse.

## Ajuste posterior: columna "Conteo físico" menos amontonada

- La columna queda en una sola línea: [Cuadra / Sobran / Faltan o "Usar estimada"] [campo con la unidad adentro] [✕ deshacer].
- La unidad va dentro del campo (y de la caja de la estimada), sin las flechas del input numérico.
- "Último conteo · fecha · usuario" pasa debajo del nombre del producto (el correo completo queda en el title).

## Ajuste posterior: calendario del panel en "Otra fecha"

- Nuevo `design-system/components/date-time-picker.tsx` (`DateTimePicker`): botón `outline` con la fecha y popover con el mismo `Calendar` de `DateRangeFilter`, hora y minutos con `Select` y "Aplicar". Valida mínimo (7 días atrás) y máximo (ahora) con un mensaje en vez de dejar elegir días deshabilitados.
- `CountedAtField` usa `DateTimePicker` en vez del `datetime-local` nativo del navegador.
- README y showcase del design system actualizados.
