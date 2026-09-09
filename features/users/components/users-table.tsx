"use client";

import { cn } from "cn";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/auth-store";
import { useUsers } from "../hooks/use-users";
import { useSetUserActive } from "../hooks/use-set-user-active";
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

export function UsersTable() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const users = useUsers();
  const setActive = useSetUserActive();

  const items = users.data ?? [];
  const errorMessage = (setActive.error as ApiError | null)?.message;

  function handleToggle(user: AppUser, nextIsActive: boolean) {
    setActive.mutate({ id: user.id, isActive: nextIsActive });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">Usuarios existentes</h2>

      {errorMessage && (
        <div role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-normal">Correo</th>
              <th className="pb-2 pr-4 font-normal">Nombre</th>
              <th className="pb-2 pr-4 font-normal">Rol</th>
              <th className="pb-2 pr-4 font-normal">Creado</th>
              <th className="pb-2 font-normal">Activo</th>
            </tr>
          </thead>
          <tbody>
            {users.isLoading ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-sm text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : users.isError ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-sm text-destructive">
                  No se pudo cargar la lista de usuarios.
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-sm text-muted-foreground">
                  Todavía no hay usuarios.
                </td>
              </tr>
            ) : (
              items.map((user) => {
                const isSelf = user.id === currentUserId;
                const isTogglingThisRow =
                  setActive.isPending && setActive.variables?.id === user.id;
                return (
                  <tr key={user.id} className="border-b border-border last:border-b-0">
                    <td className="py-3 pr-4 text-sm font-medium text-foreground">{user.email}</td>
                    <td className="py-3 pr-4 text-sm text-foreground">{user.name ?? "—"}</td>
                    <td className="py-3 pr-4 text-sm text-foreground">{ROLE_LABEL[user.role]}</td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">
                      {formatLongDate(user.createdAt.slice(0, 10))}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          disabled={isSelf || isTogglingThisRow}
                          onCheckedChange={(checked) => handleToggle(user, checked)}
                          aria-label={user.isActive ? `Desactivar a ${user.email}` : `Activar a ${user.email}`}
                        />
                        <span
                          className={cn(
                            "text-xs",
                            user.isActive ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {isSelf ? "Tú" : user.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
