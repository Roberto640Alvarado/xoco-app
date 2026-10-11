"use client";

import Link from "next/link";
import { EyeOff, Eye } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useInventoryAccess } from "../hooks/use-inventory-access";

// Aviso para Admin/Finanzas en todas las pantallas de Inventario: el módulo
// todavía no es visible para los Vendedores hasta que el Super admin lo
// habilite por tienda (Administración → Inventario), y se recomienda cargar
// primero el stock de cada tienda. Cambia de texto según cuántas tiendas ya
// estén habilitadas.
export function InventoryVisibilityNotice() {
  const user = useAuthStore((state) => state.user);
  const { data: access } = useInventoryAccess();
  const { data: stores } = useStores();

  if (!user || user.role === "VENDEDOR" || !access) return null;

  const total = stores?.length ?? 0;
  const enabled = access.enabledPosConfigIds.length;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const Icon = enabled === 0 ? EyeOff : Eye;

  const adminLink = isSuperAdmin ? (
    <Link href="/dashboard/admin/inventario" className="font-medium underline underline-offset-2">
      Administración → Inventario
    </Link>
  ) : (
    "Administración → Inventario (solo Super admin)"
  );

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-sky-600/30 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="leading-relaxed">
        {enabled === 0 ? (
          <>
            <span className="font-medium">Inventario todavía no es visible para las tiendas.</span> Los Vendedores no lo
            verán hasta que el Super admin lo habilite por tienda en {adminLink}.
          </>
        ) : (
          <>
            <span className="font-medium">
              Inventario es visible para {enabled}
              {total > 0 ? ` de ${total}` : ""} tienda{enabled === 1 ? "" : "s"}.
            </span>{" "}
            El resto sigue oculto para sus Vendedores hasta que se habilite en {adminLink}.
          </>
        )}{" "}
        Se recomienda ingresar manualmente el stock de cada tienda (Conteo) antes de habilitarla.
      </p>
    </div>
  );
}
