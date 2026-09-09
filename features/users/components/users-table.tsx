"use client";

import { useState } from "react";
import { cn } from "cn";
import { KeyRound, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
};

// Rol como pill — SUPER_ADMIN se distingue con el color de marca (tiene
// acceso a todo, incluida esta misma pantalla); FINANZAS es un tono
// neutro. Mismo patrón visual que el estado Activo/Inactivo de abajo.
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

export function UsersTable() {
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
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Usuarios existentes</h2>
          <p className="text-xs text-muted-foreground">
            {users.isLoading ? "Cargando..." : `${items.length} cuenta${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {errorMessage && !activeConfirm && (
        <div role="alert" className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="hidden md:table-cell">Creado</TableHead>
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
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
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
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTarget(user)}
                        aria-label={`Editar a ${user.email}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPasswordTarget(user)}
                        aria-label={`Cambiar contraseña de ${user.email}`}
                      >
                        <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Cambiar contraseña</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

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
