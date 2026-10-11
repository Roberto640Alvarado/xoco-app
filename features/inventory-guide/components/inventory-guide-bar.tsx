"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Compass, Info, Play, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/auth-store";
import {
  FLOW,
  PAGE_INTRO,
  PAGE_LABEL,
  PERMISSIONS,
  ROLE_LABEL,
  type GuidePage,
  type GuideRole,
} from "../content";
import { useInventoryTour } from "../hooks/use-inventory-tour";

// Ruta -> pantalla de Inventario. /dashboard/inventario es Conteo; el resto
// son subrutas (y la habilitación por tienda vive en Administración).
function pageFromPath(pathname: string): GuidePage {
  if (pathname.startsWith("/dashboard/admin/inventario")) return "habilitacion";
  if (pathname.startsWith("/dashboard/inventario/solicitudes")) return "solicitudes";
  if (pathname.startsWith("/dashboard/inventario/movimientos")) return "movimientos";
  if (pathname.startsWith("/dashboard/inventario/registro")) return "registro";
  return "conteo";
}

const PAGE_ORDER: GuidePage[] = ["conteo", "solicitudes", "movimientos", "registro"];

const ROLE_STYLE: Record<GuideRole, string> = {
  admin: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  finanzas: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  vendedor: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export function guideRoleFor(role: string | undefined): GuideRole {
  if (role === "SUPER_ADMIN") return "admin";
  if (role === "FINANZAS") return "finanzas";
  return "vendedor";
}

// Card del tour guiado, común a todas las pantallas de Inventario (se monta
// en app/dashboard/inventario/layout.tsx y en Administración → Inventario):
// "Iniciar tour" lanza el recorrido de la pantalla actual y el botón ⓘ abre
// un modal con el flujo completo, qué hace cada pantalla y qué puede (y qué
// no) hacer el rol de quien mira. El contenido depende del rol: Admin,
// Finanzas o Vendedor.
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
  const pages = role === "admin" ? [...PAGE_ORDER, "habilitacion" as GuidePage] : PAGE_ORDER;

  return (
    <>
      <section
        aria-label="Tour guiado"
        className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/[0.06] via-card to-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Compass className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold leading-tight text-foreground">Tour guiado</h2>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", ROLE_STYLE[role])}>
                {ROLE_LABEL[role]}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">Conoce esta pantalla paso a paso.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => void start()} className="relative">
            <Play className="size-4" aria-hidden="true" />
            Iniciar tour
            {!seen && (
              <span className="absolute -right-1 -top-1 flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
              </span>
            )}
          </Button>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setOpen(true)}
                  aria-label="Más información: cómo funciona Inventario"
                />
              }
            >
              <Info className="size-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>Cómo funciona Inventario</TooltipContent>
          </Tooltip>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
              Cómo funciona Inventario
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ROLE_STYLE[role])}>
                {ROLE_LABEL[role]}
              </span>
            </DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">{flow.intro}</DialogDescription>
          </DialogHeader>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Tu rol: {ROLE_LABEL[role]}</h3>
            <div className={cn("grid gap-3", permissions.cannot.length > 0 && "sm:grid-cols-2")}>
              <div className="rounded-lg border border-emerald-600/25 bg-emerald-500/5 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Puedes</p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {permissions.can.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-snug text-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {permissions.cannot.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">No puedes</p>
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {permissions.cannot.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm leading-snug text-foreground">
                        <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
