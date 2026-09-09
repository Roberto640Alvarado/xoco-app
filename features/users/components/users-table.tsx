"use client";

import { useState } from "react";
import { cn } from "cn";
import { KeyRound, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function UsersTable() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const users = useUsers();
  const setActive = useSetUserActive();
  const [passwordTarget, setPasswordTarget] = useState<AppUser | null>(null);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);

  const items = users.data ?? [];
  const errorMessage = (setActive.error as ApiError | null)?.message;

  function handleToggle(user: AppUser, nextIsActive: boolean) {
    setActive.mutate({ id: user.id, isActive: nextIsActive });
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

      {errorMessage && (
        <div role="alert" className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

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
                        onCheckedChange={(checked) => handleToggle(user, checked)}
                        aria-label={user.isActive ? `Desactivar a ${user.email}` : `Activar a ${user.email}`}
                      />
                      <StatusPill isActive={user.isActive} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditTarget(user)}
                        aria-label={`Editar a ${user.email}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPasswordTarget(user)}
                        aria-label={`Cambiar contraseña de ${user.email}`}
                      >
                        <KeyRound className="h-4 w-4" aria-hidden="true" />
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
    </div>
  );
}
