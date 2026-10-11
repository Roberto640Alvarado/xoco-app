"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportHeader } from "@/features/page-guide/components/report-header";
import { UsersTable } from "./users-table";

// Pantalla Administración → Usuarios: el botón "Agregar usuario" va en el
// encabezado y la tabla (Panel) es el primer bloque tras él, que es donde
// ancla el tour guiado.
export function UsersView() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex max-w-6xl flex-col gap-4">
      <ReportHeader page="admin-usuarios">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <UserPlus aria-hidden="true" />
          Agregar usuario
        </Button>
      </ReportHeader>
      <UsersTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
