"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { InfoBadge } from "@/design-system/components/info-badge";
import { ROLE_TONE, RolePermissions } from "@/features/page-guide/components/role-permissions";
import { TourGuideCard } from "@/design-system/components/tour-guide-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth-store";
import {
  FLOW,
  PAGE_INTRO,
  PAGE_LABEL,
  guideRoleFor,
  PERMISSIONS,
  ROLE_LABEL,
  type GuidePage,
} from "../content";
import { useInventoryTour } from "../hooks/use-inventory-tour";

// Ruta -> pantalla de Inventario. /dashboard/inventario es Conteo; el resto
// son subrutas (y la habilitación por tienda vive en Administración).
function pageFromPath(pathname: string): GuidePage {
  if (pathname.startsWith("/dashboard/admin/inventario")) return "habilitacion";
  if (pathname.startsWith("/dashboard/inventario/solicitudes")) return "solicitudes";
  if (pathname.startsWith("/dashboard/inventario/movimientos")) return "movimientos";
  if (pathname.startsWith("/dashboard/inventario/registro")) return "registro";
  if (pathname.startsWith("/dashboard/inventario/kardex")) return "kardex";
  if (pathname.startsWith("/dashboard/inventario/recetas")) return "recetas";
  return "conteo";
}

const PAGE_ORDER: GuidePage[] = ["conteo", "solicitudes", "movimientos", "registro", "kardex"];
// Planta solo tiene Solicitudes.
const PLANTA_PAGES: GuidePage[] = ["solicitudes"];

// Card del tour guiado, común a todas las pantallas de Inventario (se monta
// en app/dashboard/inventario/layout.tsx y en Administración → Inventario):
// "Iniciar tour" lanza el recorrido de la pantalla actual y el botón ⓘ abre
// un modal con el flujo completo, qué hace cada pantalla y qué puede (y qué
// no) hacer el rol de quien mira. El contenido depende del rol: Admin,
// Finanzas, Vendedor o Planta.
export function InventoryGuideBar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const role = guideRoleFor(user?.role);
  const page = pageFromPath(pathname);
  const [open, setOpen] = useState(false);
  const { start, seen } = useInventoryTour(page, role, user?.email);

  if (!user) return null;
  const flow = FLOW[role];
  const permissions = PERMISSIONS[role];
  const pages = role === "admin" ? [...PAGE_ORDER, "recetas" as GuidePage, "habilitacion" as GuidePage] : role === "planta" ? PLANTA_PAGES : PAGE_ORDER;

  return (
    <>
      <TourGuideCard
        badge={
          <InfoBadge tone={ROLE_TONE[role]} size="sm">
            {ROLE_LABEL[role]}
          </InfoBadge>
        }
        onStart={() => void start()}
        showNewDot={!seen}
        onInfo={() => setOpen(true)}
        infoLabel="Cómo funciona Inventario"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
              Cómo funciona Inventario
              <InfoBadge tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</InfoBadge>
            </DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">{flow.intro}</DialogDescription>
          </DialogHeader>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Tu rol: {ROLE_LABEL[role]}</h3>
            <RolePermissions can={permissions.can} cannot={permissions.cannot} />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">El flujo, paso a paso</h3>
            <ol className="flex flex-col gap-2">
              {flow.steps.map((step) => (
                <li key={step.title} className="rounded-lg border border-border bg-card px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Qué hace cada pantalla</h3>
            <ul className="flex flex-col gap-2">
              {pages.map((key) => (
                <li
                  key={key}
                  className={cn(
                    "rounded-lg border px-3 py-2.5",
                    key === page ? "border-primary/40 bg-primary/5" : "border-border bg-card",
                  )}
                >
                  <p className="text-sm font-medium text-foreground">
                    {PAGE_LABEL[key]}
                    {key === page && <span className="ml-2 text-xs font-normal text-primary">estás aquí</span>}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{PAGE_INTRO[key][role]}</p>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-muted-foreground">
            Busca el ícono ⓘ junto a los encabezados de las tablas para ver qué significa cada dato, y usa
            &quot;Iniciar tour&quot; para un recorrido guiado de la pantalla.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
