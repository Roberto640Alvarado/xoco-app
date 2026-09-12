"use client";

import { useState } from "react";
import { PermissionsRoleTabs } from "./permissions-role-tabs";
import { PermissionsModuleList } from "./permissions-module-list";
import type { UserRole } from "@/features/auth/types/auth.types";

// Raíz con estado del panel "Permisos" — mantiene el rol seleccionado y
// compone el selector + la lista, para que app/dashboard/admin/permisos/
// page.tsx se quede como shell delgado (mismo criterio que
// app/dashboard/admin/users/page.tsx).
export function PermissionsPanel() {
  const [role, setRole] = useState<UserRole>("VENDEDOR");

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-xs">
        <PermissionsRoleTabs value={role} onChange={setRole} />
      </div>
      <PermissionsModuleList role={role} />
    </div>
  );
}
