# SectionCard solo con controles (Registro)

## Objetivo
En Registro, quitar el título y la frase de la card y dejar los controles en una sola línea.

## Cambios realizados
- `SectionCard` reemplaza `stacked` por `controlsOnly`: con varios controles queda solo la fila de controles (sin ícono, título ni frase).
- Registro (`InventoryLedger` y su estado sin tienda) usa `<SectionCard controlsOnly>`; README y catálogo actualizados.

## Resultado final
`tsc` y `eslint` sin errores nuevos.
