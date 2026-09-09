# Guarda de ruta en Administración, cambio de contraseña y rediseño

## Contexto

El usuario compartió capturas de las páginas "Administración" y "Usuarios" (ver plan-history "gestion-usuarios") ya funcionando y pidió 3 cosas en el mismo mensaje:

1. Confirmar que FINANZAS no tiene acceso a Administración y que SUPER_ADMIN sí tiene acceso a todo.
2. Poder cambiar la contraseña de un usuario existente desde Administración.
3. Mejor diseño para esas páginas.

## 1) Guarda de ruta

Antes de esto, el control de rol era **solo** ocultar el link "Administración" del nav (`DashboardShell.visibleNavItems`, `components/layout/dashboard-shell.tsx`) — nada impedía que una sesión FINANZAS entrara directo por URL a `/dashboard/admin/**`. El backend ya protegía cada endpoint de administración (`UsersController`, `OdooConfigController`, ambos con `@Roles(Role.SUPER_ADMIN)` — confirmado con `grep -rn "@Roles" src`), así que los datos nunca estuvieron expuestos, pero la UI sí podía llegar a renderizarse.

Nuevo `app/dashboard/admin/layout.tsx` (client component): espera a que `useAuthStore` termine de hidratarse (mismo patrón que `DashboardShell`/`app/not-found.tsx`) y, si el usuario no es `SUPER_ADMIN`, redirige a `/dashboard` (o a `/login` si no hay sesión). Mientras no está hidratado o el rol no califica, muestra el mismo spinner que ya usan esos 2 archivos — así nunca hay un frame donde el contenido de administración llegue a pintarse para quien no debería verlo.

SUPER_ADMIN no está restringido en ningún controller (`sales`, `goals`, `sales-goals`, `ticket-goals` aceptan `SUPER_ADMIN, FINANZAS`; `users` y `odoo-config` aceptan solo `SUPER_ADMIN`) — ya tenía acceso a todo, esto no cambió.

## 2) Cambiar contraseña de un usuario

**Backend** (`xoco-api`) — `PATCH /users/:id/password`, mismo patrón que `POST /users` (`CreateUserDto`): `password` + `confirmPassword` deben coincidir (si no, 400), usuario debe existir (si no, 404), hash con bcrypt costo 12 (mismo `BCRYPT_COST` que ya usa `createUser`). Nuevo `SetUserPasswordDto`, `UsersService.setPassword`, `UsersRepository.setPassword`. Verificado en proceso con `NestFactory.createApplicationContext` (mismo método que las otras verificaciones de esta sesión): crea un usuario temporal, prueba los 3 casos de error, cambia la contraseña, confirma con `bcrypt.compare` que el hash nuevo valida y el viejo ya no, y borra el usuario de prueba directo por Prisma al final.

**Frontend** (`xoco-app`) — `features/users/`: `SetUserPasswordPayload` (types), `setUserPassword` (api, usa `apiPatch` ya existente), `useSetUserPassword` (hook, sin actualizar caché de `["users"]` porque la respuesta no trae ningún campo visible en la tabla), `set-user-password.schema.ts` (zod, mismo `.refine()` que `create-user.schema.ts`), y `components/set-user-password-modal.tsx` — modal (mismo patrón que `TicketGoalPercentModal`: `Dialog` controlado desde afuera, estado de éxito que auto-cierra a los 1.2s). Se abre desde un botón nuevo por fila en `UsersTable` (ícono `KeyRound`, `Button variant="ghost" size="icon-sm"`).

## 3) Rediseño

- **`app/dashboard/admin/page.tsx`**: header con título + subtítulo; las cards ahora tienen el ícono en un badge circular más grande, borde y sombra sutil al hover, y una flecha (`ArrowRight`) que se desplaza al hover.
- **`features/users/components/users-table.tsx`**: reescrita sobre `components/ui/table.tsx` (ya existía en el proyecto, usado por otras 3 tablas, pero esta seguía con un `<table>` a mano). Cada fila ahora muestra `UserAvatar` + correo/nombre juntos, el rol como pill (`SUPER_ADMIN` con ícono `ShieldCheck` y color de marca, `FINANZAS` en tono neutro) y el estado como pill con punto de color (verde `emerald` para activo — mismo verde que ya usa `features/cierre-mes/components/month-close-section.tsx` — gris para inactivo) en vez de solo texto. El switch de activar/desactivar se mantiene igual, junto a la pill.
- **`features/users/components/create-user-form.tsx`**: header con ícono (`UserPlus`) igual que el resto de las cards; los 2 campos de contraseña ahora usan `components/ui/password-input.tsx` (ya existía en el proyecto, con botón de ojo para mostrar/ocultar, pero no se usaba en este formulario todavía) en vez de un `<input type="password">` sin esa opción.
- `app/dashboard/admin/users/page.tsx`: `max-w-3xl` → `max-w-4xl` para que la tabla (ahora con una columna más, "Acciones") tenga más espacio.

No se tocó `app/dashboard/admin/odoo/page.tsx` — el usuario no mandó capturas de esa página ni pidió cambios ahí.

## Verificación

- `xoco-api`: `npm run build` y `npm run lint` limpios. `setPassword` verificado en proceso contra Mongo real (ver arriba) — script temporal borrado después de usarlo.
- `xoco-app`: `npm run build` y `npm run lint` limpios (el único warning es el preexistente de `lib/api/client.ts`, no relacionado). Las 3 rutas de Administración siguen generándose como estáticas (`○`) — el guard nuevo no forzó renderizado dinámico, mismo cuidado que ya se tomó en `app/not-found.tsx`.
- **De nuevo no fue posible probar la UI en vivo en el navegador en esta sesión** — mismo límite ya documentado en el plan-history de "gestion-usuarios" (los procesos en segundo plano, como `npm run dev`, no sobreviven entre una llamada de herramienta y la siguiente en este entorno).

## Pendiente

- El usuario debe revisar en vivo: que el guard realmente saque a una sesión FINANZAS que entre por URL a `/dashboard/admin` (y que un refresh directo en esa URL con SUPER_ADMIN cargue normal, sin parpadeo raro); que el modal de "Cambiar contraseña" se vea y funcione bien, y que la nueva contraseña sirva para iniciar sesión; y que el rediseño de ambas páginas (cards, pills, avatar) se vea bien.
