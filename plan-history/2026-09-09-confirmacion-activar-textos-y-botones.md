# Confirmar activar/desactivar, botones con texto y ajustes de copy

## Contexto

Feedback puntual del usuario sobre lo ya construido en Administración/Usuarios (ver capturas), 5 pedidos cortos:

1. Quitar de la página de Odoo la explicación de dónde vive el API key.
2. Mejor texto en la card "Usuarios" del índice de Administración.
3. Mejor texto en el subtítulo de la página Usuarios.
4. Pedir confirmación antes de activar/desactivar una cuenta.
5. Los botones de acciones por fila deben llevar texto ("Editar" / "Cambiar contraseña"), no solo ícono.

## Cambios

- **`app/dashboard/admin/odoo/page.tsx`**: se quitó el párrafo "El API key nunca se guarda en variables de entorno...". Queda solo el `<h1>`.
- **`app/dashboard/admin/page.tsx`**: descripción de la card "Usuarios" pasa de "Alta de cuentas, rol y activo/inactivo — SUPER_ADMIN / FINANZAS." a "Crea cuentas, asigna su rol y activa o desactiva su acceso." — menos jerga de nombres de rol en mayúsculas (los roles ya se ven como pill en la tabla, no hace falta repetirlos acá).
- **`app/dashboard/admin/users/page.tsx`**: subtítulo pasa de "Altas y bajas de cuentas SUPER_ADMIN / FINANZAS. No hay registro público..." a "Administra quién tiene acceso al panel: crea cuentas, asigna su rol y actívalas o desactívalas. No hay registro público — toda cuenta se crea desde aquí."
- **Nuevo `components/ui/confirm-dialog.tsx`**: confirmación genérica sobre el mismo `<Dialog>` que ya usan `SetUserPasswordModal`/`EditUserModal` (no se agregó `alert-dialog` de shadcn para esto solo). Recibe título/descripción/labels y un `variant` ("destructive" para desactivar, "default" para activar).
- **`features/users/components/users-table.tsx`**: el `onCheckedChange` del switch ya no dispara `setActive.mutate` directo — ahora abre `ConfirmDialog` con `{ user, nextIsActive }`; el switch sigue reflejando `user.isActive` (el valor real) hasta que la mutación confirma. Los 2 botones de la columna Acciones pasan de `variant="ghost" size="icon-sm"` (solo ícono + `aria-label`) a `variant="outline" size="sm"` con ícono + texto visible.

## Verificación

`npm run lint` y `npm run build` limpios (mismo warning preexistente). No se pudo probar en vivo en el navegador en esta sesión (mismo límite ya documentado varias veces en esta serie de plan-history).

## Pendiente

El usuario debe revisar en vivo que el diálogo de confirmación se vea bien y que el switch no cambie visualmente hasta confirmar, y que los botones con texto no rompan el layout de la tabla en pantallas angostas (la tabla ya tiene scroll horizontal propio).
