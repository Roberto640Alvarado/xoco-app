"use client";

import { useState } from "react";
import { ReportHeader } from "@/features/page-guide/components/report-header";
import { PermissionsRoleTabs } from "./permissions-role-tabs";
import { PermissionsModuleList } from "./permissions-module-list";
import type { UserRole } from "@/features/auth/types/auth.types";

// Raíz con estado de la pantalla "Permisos": el selector de rol va en el
// encabezado y la lista de módulos es el primer bloque tras él (ancla del
// tour guiado).
export function PermissionsPanel() {
  const [role, setRole] = useState<UserRole>("VENDEDOR");

  return (
    <div className="flex flex-col gap-4">
      <ReportHeader page="admin-permisos">
        <PermissionsRoleTabs value={role} onChange={setRole} />
      </ReportHeader>
      <PermissionsModuleList role={role} />
    </div>
  );
}
