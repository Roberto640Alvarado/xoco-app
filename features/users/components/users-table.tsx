"use client";

import { useState } from "react";
import { Panel } from "@/design-system/components/panel";
import { InfoBadge } from "@/design-system/components/info-badge";
import { cn } from "cn";
import { KeyRound, Pencil, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { useAuthStore } from "@/store/auth-store";
import { useUsers } from "../hooks/use-users";
import { useSetUserActive } from "../hooks/use-set-user-active";
import { SetUserPasswordModal } from "./set-user-password-modal";
import { EditUserModal } from "./edit-user-modal";
import { CreateUserModal } from "./create-user-modal";
import { formatLongDate } from "@/lib/format";
import type { AppUser } from "../types/users.types";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { ApiError } from "@/lib/api/client";

// Mismas etiquetas que components/layout/dashboard-shell.tsx (no
// exportadas desde ahí — se duplica el mapa acá para no tocar ese
// archivo ya probado, mismo criterio que el resto de módulos de este
// proyecto).
const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
  VENDEDOR: "Vendedor",
};

function RolePill({ role }: { role: UserRole }) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  return (
    <InfoBadge tone={isSuperAdmin ? "violet" : role === "FINANZAS" ? "info" : "warning"} icon={isSuperAdmin ? ShieldCheck : undefined}>
      {ROLE_LABEL[role]}
    </InfoBadge>
  );
}

function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <InfoBadge tone={isActive ? "success" : "neutral"} dot>
      {isActive ? "Activo" : "Inactivo"}
    </InfoBadge>
  );
}

interface ActiveConfirmTarget {
  user: AppUser;
  nextIsActive: boolean;
}

interface UserRowActionsProps {
  user: AppUser;
  onEdit: () => void;
  onChangePassword: () => void;
  className?: string;
}

// Botones de "Editar" y "Cambiar contraseña" — un solo componente para
// que la tabla (md+) y las tarjetas (mobile) queden pixel-a-pixel
// consistentes en vez de mantener dos JSX casi iguales.
function UserRowActions({ user, onEdit, onChangePassword, className }: UserRowActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Button type="button" variant="outline" size="sm" onClick={onEdit} aria-label={`Editar a ${user.email}`}>
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Editar</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onChangePassword}
        aria-label={`Cambiar contraseña de ${user.email}`}
      >
        <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Cambiar contraseña</span>
      </Button>
    </div>
  );
}

// Tarjetas de esqueleto para el estado de carga en mobile (< md) — mismo
// criterio que TableSkeletonRows, pero con la forma de una tarjeta de
// usuario en vez de una fila.
function UserCardSkeletonList({ count }: { count: number }) {
  return (
    <div className="divide-y divide-border md:hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

interface UsersTableProps {
  /** El botón "Agregar usuario" vive en el encabezado de la pantalla. */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function UsersTable({ createOpen, onCreateOpenChange }: UsersTableProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const users = useUsers();
  const setActive = useSetUserActive();
  const [passwordTarget, setPasswordTarget] = useState<AppUser | null>(null);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [activeConfirm, setActiveConfirm] = useState<ActiveConfirmTarget | null>(null);

  const items = users.data ?? [];

  // El banner de arriba de la tabla solo cubre errores fuera de un modal
  // (no debería quedar ninguno ahora que activar/desactivar también pasa
  // por ConfirmDialog, que muestra su propio error) — se deja por si
  // algún error llega sin pasar por el diálogo.
  const errorMessage = (setActive.error as ApiError | null)?.message;
  const confirmErrorMessage =
    activeConfirm && setActive.isError && setActive.variables?.id === activeConfirm.user.id ? errorMessage : null;

  function handleConfirmActive() {
    if (!activeConfirm) return;
    setActive.mutate(
      { id: activeConfirm.user.id, isActive: activeConfirm.nextIsActive },
      { onSuccess: () => setActiveConfirm(null) },
    );
  }

  return (
    <Panel
      flush
      icon={Users}
      title="Cuentas existentes"
      description={users.isLoading ? "Cargando..." : `${items.length} cuenta${items.length === 1 ? "" : "s"}`}
    >
      {errorMessage && !activeConfirm && (
        <div role="alert" className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Tabla — md y superior. Nunca en scroll horizontal: todas las
          columnas caben porque "Creado" desaparece y las acciones pasan a
          solo ícono antes de llegar a este breakpoint. */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isLoading ? (
              <TableSkeletonRows rows={4} columns={5} />
            ) : users.isError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm whitespace-normal text-destructive">
                  No se pudo cargar la lista de usuarios.
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm whitespace-normal text-muted-foreground">
                  Todavía no hay usuarios.
                </TableCell>
              </TableRow>
            ) : (
              items.map((user) => {
                const isSelf = user.id === currentUserId;
                const isTogglingThisRow = setActive.isPending && setActive.variables?.id === user.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="whitespace-normal">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={user.name} email={user.email} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.name ?? "Sin nombre"} {isSelf && "· Tú"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RolePill role={user.role} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLongDate(user.createdAt.slice(0, 10))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          disabled={isSelf || isTogglingThisRow}
                          onCheckedChange={(checked) => setActiveConfirm({ user, nextIsActive: checked })}
                          aria-label={user.isActive ? `Desactivar a ${user.email}` : `Activar a ${user.email}`}
                        />
                        <StatusPill isActive={user.isActive} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <UserRowActions
                        user={user}
                        onEdit={() => setEditTarget(user)}
                        onChangePassword={() => setPasswordTarget(user)}
                        className="justify-end"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Tarjetas — por debajo de md. Misma información que la tabla,
          reorganizada en vertical en vez de encogida u obligando a hacer
          scroll horizontal (ver Sistema de Diseño, "Responsive"). */}
      {users.isLoading ? (
        <UserCardSkeletonList count={3} />
      ) : users.isError ? (
        <p className="p-4 text-center text-sm text-destructive md:hidden">No se pudo cargar la lista de usuarios.</p>
      ) : items.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted-foreground md:hidden">Todavía no hay usuarios.</p>
      ) : (
        <ul className="divide-y divide-border md:hidden">
          {items.map((user) => {
            const isSelf = user.id === currentUserId;
            const isTogglingThisRow = setActive.isPending && setActive.variables?.id === user.id;
            return (
              <li key={user.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar name={user.name} email={user.email} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.name ?? "Sin nombre"} {isSelf && "· Tú"}
                      </p>
                    </div>
                  </div>
                  <StatusPill isActive={user.isActive} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <RolePill role={user.role} />
                  <span>Creado {formatLongDate(user.createdAt.slice(0, 10))}</span>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-xs font-medium text-foreground">
                    {user.isActive ? "Cuenta activa" : "Cuenta inactiva"}
                  </span>
                  <Switch
                    checked={user.isActive}
                    disabled={isSelf || isTogglingThisRow}
                    onCheckedChange={(checked) => setActiveConfirm({ user, nextIsActive: checked })}
                    aria-label={user.isActive ? `Desactivar a ${user.email}` : `Activar a ${user.email}`}
                  />
                </div>

                <UserRowActions
                  user={user}
                  onEdit={() => setEditTarget(user)}
                  onChangePassword={() => setPasswordTarget(user)}
                  className="[&>button]:flex-1"
                />
              </li>
            );
          })}
        </ul>
      )}

      <CreateUserModal open={createOpen} onOpenChange={onCreateOpenChange} />
      <EditUserModal
        user={editTarget}
        isSelf={editTarget?.id === currentUserId}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
      <SetUserPasswordModal user={passwordTarget} onOpenChange={(open) => !open && setPasswordTarget(null)} />
      <ConfirmDialog
        open={activeConfirm !== null}
        onOpenChange={(open) => !open && setActiveConfirm(null)}
        title={
          activeConfirm
            ? activeConfirm.nextIsActive
              ? `¿Activar a ${activeConfirm.user.email}?`
              : `¿Desactivar a ${activeConfirm.user.email}?`
            : ""
        }
        description={
          activeConfirm?.nextIsActive
            ? "Podrá iniciar sesión de nuevo de inmediato."
            : "No podrá iniciar sesión hasta que vuelvas a activar la cuenta."
        }
        confirmLabel={activeConfirm?.nextIsActive ? "Activar" : "Desactivar"}
        variant={activeConfirm?.nextIsActive ? "default" : "destructive"}
        isLoading={setActive.isPending}
        errorMessage={confirmErrorMessage}
        onConfirm={handleConfirmActive}
      />
    </Panel>
  );
}
