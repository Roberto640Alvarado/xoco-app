# Rediseño de cards de Inventario y tour guiado por rol

## Pedido
Cards breves, sin "—", con los botones a la vista; la card del tour debe decir solo "Tour guiado"; cada sección con su tour; validar y explicar según el rol (Admin, Finanzas, Vendedor) qué puede y qué no; buen diseño para todas.

## Qué se hizo
- Nuevo `components/ui/section-card.tsx` (`SectionCard`): ícono, título, una frase corta y botones a la derecha (o debajo con `stacked`). Reemplaza a `FilterToolbar` en Conteo, Solicitudes, Movimientos y Registro. Textos breves por rol.
- `InventoryGuideBar` rediseñada: título "Tour guiado" + pastilla con el rol (Admin / Finanzas / Vendedor), botón "Iniciar tour" y botón ⓘ. El modal ahora trae "Tu rol" con lo que Puedes / No puedes hacer, el flujo del rol y qué hace cada pantalla.
- `content.ts`: tres roles (`admin`, `finanzas`, `vendedor`) en FLOW, PAGE_INTRO, PERMISSIONS y TOURS. Finanzas no puede habilitar tiendas; Vendedor tiene los pasos con aclaraciones de solo lectura / no confirma. Nueva pantalla "habilitacion" (solo Admin) con su tour en Administración → Inventario; la card del tour también se monta ahí.
- `InventoryVisibilityNotice` rediseñado: frase corta de estado y, solo para el Admin, botón "Habilitar tiendas"; Finanzas ve a quién pedirlo. Con ancla `inv-visibility` para el tour.
- Panel de habilitación: nota compacta con botón "Ir a Conteo" y anclas `access-note`, `access-list`, `access-switch`.
- Se quitaron los "—" de los mensajes visibles de Inventario (estados, confirmaciones).
