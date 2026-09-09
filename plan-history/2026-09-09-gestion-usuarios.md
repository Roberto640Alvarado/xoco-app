# Gestión de usuarios: página "Usuarios" en Administración

## Contexto

Ver plan-history de xoco-api ("gestion-usuarios") para el pedido original y el diseño del backend nuevo (`GET/POST /users`, `PATCH /users/:id/active`). Este archivo cubre solo la UI.

La sección "Usuarios" ya existía como card deshabilitada en `app/dashboard/admin/page.tsx` ("Próximamente: alta de cuentas SUPER_ADMIN / FINANZAS.") — se activa acá.

## Diseño

**`app/dashboard/admin/users/page.tsx`** — 2 bloques apilados, mismo layout de tarjetas (`rounded-xl border border-border bg-card p-4`) que ya usa `app/dashboard/admin/odoo/page.tsx` (la única otra página de Administración que existía, se tomó como referencia directa de patrones: react-hook-form + zod, banners de éxito/error, `Loader2` en el botón mientras envía).

**`features/users/`** (nuevo, mismo patrón de carpeta que `features/odoo-config/`):
- `types/users.types.ts` — `AppUser`, `CreateUserPayload`.
- `api/users.api.ts` — `fetchUsers`, `createUser` (usa `apiPost`, ya existía en `lib/api/client.ts`), `setUserActive` (usa `apiPatch`, también ya existía — a diferencia de `odoo-config.api.ts`, que tuvo que usar `apiClient.put` directo porque no había helper `apiPut`).
- `hooks/use-users.ts`, `hooks/use-create-user.ts`, `hooks/use-set-user-active.ts` — `useQuery`/`useMutation` de siempre; las 2 mutaciones actualizan `["users"]` en caché directo (`setQueryData`) en vez de invalidar, para no tener que re-pedir la lista completa después de cada acción.
- `schemas/create-user.schema.ts` — zod, con `.refine()` para que `password === confirmPassword` (mismo campo `confirmPassword` que ya valida el backend — la UI lo detecta antes de mandar el POST, el backend lo vuelve a validar por si acaso).
- `components/create-user-form.tsx` — formulario (correo, nombre opcional, rol vía `Select`, contraseña + confirmar).
- `components/users-table.tsx` — tabla (correo, nombre, rol, fecha de creación, switch activo/inactivo). El switch de la fila del usuario que tiene la sesión actual (`useAuthStore((s) => s.user?.id)`) sale deshabilitado con la etiqueta "Tú" en vez de "Activo"/"Inactivo" — el backend ya bloquea la auto-desactivación (403), esto es solo para que no se vea como una opción disponible en la UI.

**`components/ui/switch.tsx`** — nuevo, no existía ningún switch/toggle en el proyecto todavía. Envuelve `@base-ui/react/switch` (mismo paquete que ya usan `select.tsx`/`radio-group.tsx`/`dialog.tsx`) — sus atributos de estado son `data-checked`/`data-unchecked` (a diferencia de Radix, que usa `data-state="checked"`), confirmado leyendo `SwitchRootDataAttributes` del paquete antes de escribir el CSS.

**`app/dashboard/admin/page.tsx`**: se quitó `disabled: true` de la card "Usuarios" y su `href` ahora apunta a `/dashboard/admin/users`. Se tuvo que tipar explícitamente `ADMIN_SECTIONS: AdminSection[]` (antes era un array inferido) porque, al quedar un solo objeto con la propiedad opcional `disabled`, TypeScript dejó de inferirla en el tipo del array y `section.disabled` en el JSX ya no compilaba.

Etiquetas de rol ("Super admin"/"Finanzas") duplicadas en `users-table.tsx` en vez de importarlas del `ROLE_LABEL` no exportado de `components/layout/dashboard-shell.tsx` — mismo criterio de todo este proyecto: no tocar un archivo ya en producción y probado solo para reusar 2 líneas.

## Verificación

- `npm run lint` y `npm run build`: limpios (el único warning es el preexistente de `lib/api/client.ts`).
- El backend detrás de esta UI quedó probado de punta a punta por HTTP real (ver plan-history de xoco-api).
- **No se pudo probar la UI real en el navegador en esta sesión** — el entorno donde corre este asistente no mantiene procesos en segundo plano (como `npm run dev`) vivos entre una llamada de herramienta y la siguiente, así que no había forma de dejar el servidor arriba el tiempo suficiente para hacer clic en el navegador integrado. Se intentó (se llegó a abrir la pantalla de login y tomar una captura), pero el servidor se cae antes de poder interactuar más.

## Pendiente

- El usuario debe revisar la UI en vivo: que el formulario se vea bien, que el `Select` de rol funcione, que el switch de activar/desactivar se vea y se sienta bien (es el primer switch de todo el proyecto, sin precedente visual que copiar), y que la fila propia se muestre correctamente deshabilitada con "Tú".
