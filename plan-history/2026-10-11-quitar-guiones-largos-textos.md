# Quitar "—" de los textos y mostrar el nombre del rol

## Objetivo
Quitar los guiones largos de los textos visibles, empezando por el modal "Agregar usuario".

## Cambios realizados
- Textos sin "—": modales Agregar usuario y Cambiar contraseña, subtítulo de Productos, confirmación de solicitud, descripciones de Mayoreo y banner de desarrollo. El "—" que marca un valor vacío en tablas se mantiene.
- Los selectores de rol (Agregar usuario, Editar usuario y Permisos) muestran la etiqueta ("Finanzas") en vez del valor interno ("FINANZAS").

## Resultado final
`tsc` sin errores y `eslint` solo con los avisos previos.
