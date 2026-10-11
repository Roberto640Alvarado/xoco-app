"use client";

import Link from "next/link";
import { Eye, EyeOff, Settings2 } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useInventoryAccess } from "../hooks/use-inventory-access";

// Aviso para Admin/Finanzas en todas las pantallas de Inventario: cuántas
// tiendas ya son visibles para sus Vendedores. Una frase corta y, solo para
// el Admin (único que puede habilitar), el botón que lleva a Administración →
// Inventario. Finanzas solo ve el estado y a quién pedírselo.
export function InventoryVisibilityNotice() {
  const user = useAuthStore((state) => state.user);
  const { data: access } = useInventoryAccess();
  const { data: stores } = useStores();

  if (!user || user.role === "VENDEDOR" || !access) return null;

  const total = stores?.length ?? 0;
  const enabled = access.enabledPosConfigIds.length;
  const isAdmin = user.role === "SUPER_ADMIN";
  const none = enabled === 0;
  const Icon = none ? EyeOff : Eye;

  return (
    <section
      role="status"
      data-tour="inv-visibility"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        none
          ? "border-amber-500/30 bg-amber-500/[0.07]"
          : "border-emerald-500/25 bg-emerald-500/[0.06]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            none ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {none
              ? "Aún oculto para los Vendedores"
              : `Visible en ${enabled}${total > 0 ? ` de ${total}` : ""} ${enabled === 1 ? "tienda" : "tiendas"}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Carga el stock de cada tienda antes de habilitarla." : "Solo el Admin habilita tiendas. Carga el stock y avísale."}
          </p>
        </div>
      </div>
      {isAdmin && (
        <Link href="/dashboard/admin/inventario" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Settings2 className="size-4" aria-hidden="true" />
          Habilitar tiendas
        </Link>
      )}
    </section>
  );
}
