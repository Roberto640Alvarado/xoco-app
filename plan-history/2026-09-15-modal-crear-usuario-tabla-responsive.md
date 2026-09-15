# Modal de crear usuario y tabla de Usuarios responsive

## Objetivo

Mejorar la vista `Administración > Usuarios`: mover el alta de usuario (antes un formulario siempre visible arriba de la tabla) a un modal, y rediseñar la tabla de usuarios existentes para que sea realmente responsive (sin depender de scroll horizontal) y con mejor jerarquía visual.

## Cambios realizados

- Nuevo `features/users/components/create-user-modal.tsx`: mismo formulario que tenía `CreateUserForm` (correo, nombre, rol, tienda si el rol es Vendedor, contraseña + confirmación), pero dentro de un `Dialog` controlado desde afuera (`open`/`onOpenChange`), siguiendo el mismo patrón que `EditUserModal` (reset de formulario y de la mutación al pasar de cerrado a abierto, mensaje de éxito que autocierra). `DialogContent` con `max-h-[85vh] overflow-y-auto` porque este formulario es más largo que el de editar.
- `features/users/components/create-user-form.tsx` eliminado — quedó reemplazado por el modal, no se dejó código muerto.
- `features/users/components/users-table.tsx` rediseñado:
  - Botón "Agregar usuario" en el encabezado de la tarjeta (mismo lugar donde antes vivía el formulario) que abre `CreateUserModal`.
  - La tabla (`<table>`) ahora solo se muestra en `md` y superior (`hidden md:block`); por debajo de `md` se muestra una lista de tarjetas (`<ul>`/`<li>`) con la misma información (avatar, correo, nombre, rol, estado con switch, fecha de creación, acciones), reorganizada verticalmente en vez de encogida o con scroll horizontal.
  - `RolePill`, `StatusPill` y los botones de acción (`UserRowActions`) se comparten entre la tabla y las tarjetas para no duplicar JSX.
  - Nuevo `UserCardSkeletonList` para el estado de carga en mobile (equivalente a `TableSkeletonRows` pero con forma de tarjeta).
- `app/dashboard/admin/users/page.tsx`: ya no renderiza `CreateUserForm`; la página abre directo en la tabla, igual que el resto de módulos del panel.

## Razones del cambio

- El formulario de alta ocupaba espacio permanente en la página aunque se usa con poca frecuencia (dar de alta un usuario nuevo) — un modal lo saca del flujo principal sin perder funcionalidad.
- El Sistema de Diseño del proyecto pide vistas "responsive por defecto... sin scroll horizontal, componentes que se reorganizan (nunca solo se 'encogen')" — la tabla anterior dependía del scroll horizontal implícito de `components/ui/table.tsx` en pantallas angostas; la lista de tarjetas cumple esa regla explícitamente para esta vista.
- Reutilizar `RolePill`/`StatusPill`/`UserRowActions` entre ambos layouts evita duplicar lógica de presentación (DRY).

## Resultado final

`npx tsc --noEmit` y `npx eslint` sobre los archivos tocados no reportan errores (solo un warning preexistente del compilador de React sobre `watch()` de react-hook-form, igual al que ya tenía `EditUserModal`). La vista de Usuarios abre directo en la tabla/tarjetas; "Agregar usuario" abre el modal nuevo.
