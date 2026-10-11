"use client";

import Link from "next/link";
import { Eye, EyeOff, Settings2 } from "lucide-react";
import { NoticeCard } from "@/components/ui/notice-card";
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
    <NoticeCard
      tone={none ? "warning" : "success"}
      icon={Icon}
      tourId="inv-visibility"
      title={
        none
          ? "Aún oculto para los Vendedores"
          : `Visible en ${enabled}${total > 0 ? ` de ${total}` : ""} ${enabled === 1 ? "tienda" : "tiendas"}`
      }
      description={isAdmin ? "Carga el stock de cada tienda antes de habilitarla." : "Solo el Admin habilita tiendas. Carga el stock y avísale."}
      action={
        isAdmin ? (
          <Link href="/dashboard/admin/inventario" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Settings2 className="size-4" aria-hidden="true" />
            Habilitar tiendas
          </Link>
        ) : undefined
      }
    />
  );
}
