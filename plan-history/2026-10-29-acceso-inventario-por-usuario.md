# Acceso a Inventario por usuario (Vendedor)

## Objetivo
Que, por ahora, solo un Vendedor específico (prueba@xocolatisimo.com.sv) vea la sección de Inventario; el resto de Vendedores la tiene bloqueada.

## Cambios realizados
- `AuthUser` y `AppUser`: nuevo campo `inventoryEnabled` (viene de `GET /auth/me` y `GET /users`).
- `useCanUseInventory`: el Vendedor necesita `inventoryEnabled` y su tienda habilitada; devuelve `blockedBy` ("user" | "store") para el mensaje.
- `InventoryAccessGate`: mensaje "Todavía no tienes acceso a Inventario" cuando falta el acceso individual. El menú lateral ya oculta Inventario vía el mismo hook.
- `EditUserModal`: interruptor "Acceso a Inventario" visible solo para rol Vendedor (schema `update-user.schema.ts` en espejo del DTO).
- `UsersTable`: badge "Inventario" junto al rol de los Vendedores con acceso.
- Administración → Inventario: la nota aclara que cada Vendedor necesita además su propio acceso.

## Razones del cambio
La habilitación por tienda abría Inventario a todos los Vendedores de la tienda; se necesitaba un piloto por persona.

## Resultado final
Vendedores bloqueados por defecto; Super admin activa el acceso por persona desde Usuarios → Editar. `tsc` y ESLint sin errores (2 warnings preexistentes de `watch()`).
