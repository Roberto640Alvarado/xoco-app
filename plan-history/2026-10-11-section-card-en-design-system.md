# SectionCard y componentes propios en design-system

## Objetivo
Guardar en la carpeta de diseño la card de información y acciones (SectionCard) para replicarla en todas las secciones de Inventario.

## Cambios realizados
- Se movieron a `design-system/components/`: `section-card`, `info-badge`, `notice-card`, `tour-guide-card`, `value-box` y `data-table` (imports actualizados a `@/design-system/components/...`). `components/ui/` queda solo con los componentes base de shadcn.
- Administración → Inventario por tienda ahora usa `SectionCard` (y la card del tour) como encabezado, igual que Conteo, Solicitudes, Movimientos y Registro.
- README y CLAUDE.md documentan dónde vive cada cosa y cómo usar SectionCard.

## Resultado final
`tsc` y `eslint` sin errores nuevos.
