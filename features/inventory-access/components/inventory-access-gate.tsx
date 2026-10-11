"use client";

import { Loader2, Lock } from "lucide-react";
import { useCanUseInventory } from "../hooks/use-inventory-access";

// Defensa de cliente para el Vendedor: si su tienda todavía no tiene
// Inventario habilitado, no se renderiza ninguna pantalla de la sección
// (aunque llegue por URL directa) — el backend igual responde 403. Admin y
// Finanzas pasan siempre.
export function InventoryAccessGate({ children }: { children: React.ReactNode }) {
  const { canUse, isLoading } = useCanUseInventory();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!canUse) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="font-medium text-foreground">Inventario todavía no está habilitado para tu tienda</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Cuando Admin lo habilite, aquí podrás ver el stock de tu tienda, pedir más stock y reportar mermas y regalías.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
