"use client";

import { useState } from "react";
import { cn } from "cn";
import { KeyRound, Pencil, ShieldCheck, UserPlus } from "lucide-react";
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

// Rol como pill — SUPER_ADMIN se distingue con el color de marca (tiene
// acceso a todo, incluida esta misma pantalla); FINANZAS/VENDEDOR es un
// tono neutro. Mismo patrón visual que el estado Activo/Inactivo de
// abajo. Compartido entre la tabla (md+) y las tarjetas (mobile).
function RolePill({ role }: { role: UserRole }) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        isSuperAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {isSuperAdmin && <ShieldCheck className="h-3 w-3" aria-hidden="true" />}
      {ROLE_LABEL[role]}
    </span>
  );
}

// Mismo verde (emerald, con variante dark) que ya usa
// features/cierre-mes/components/month-close-section.tsx para señalar
// "en buen estado" — acá, cuenta activa.
function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-muted-foreground/50")}
        aria-hidden="true"
      />
      {isActive ? "Activo" : "Inactivo"}
    </span>
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

export function UsersTable() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const users = useUsers();
  const setActive = useSetUserActive();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Usuarios existentes</h2>
          <p className="text-xs text-muted-foreground">
            {users.isLoading ? "Cargando..." : `${items.length} cuenta${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setIsCreateOpen(true)}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Agregar usuario
        </Button>
      </div>

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

      <CreateUserModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
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
    </div>
  );
}
