"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Compass, Info, Play } from "lucide-react";
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
import { FLOW, PAGE_INTRO, PAGE_LABEL, type GuidePage, type GuideRole } from "../content";
import { useInventoryTour } from "../hooks/use-inventory-tour";

// Ruta -> pantalla de Inventario. /dashboard/inventario es Conteo; el resto
// son subrutas.
function pageFromPath(pathname: string): GuidePage {
  if (pathname.startsWith("/dashboard/inventario/solicitudes")) return "solicitudes";
  if (pathname.startsWith("/dashboard/inventario/movimientos")) return "movimientos";
  if (pathname.startsWith("/dashboard/inventario/registro")) return "registro";
  return "conteo";
}

const PAGE_ORDER: GuidePage[] = ["conteo", "solicitudes", "movimientos", "registro"];

// Card del tour guiado, común a todas las pantallas de Inventario (se monta
// en app/dashboard/inventario/layout.tsx): "Iniciar tour" lanza el recorrido
// guiado de la pantalla actual y el mini botón ⓘ abre un modal con el flujo
// completo y qué hace cada pantalla. El contenido depende del rol (admin = Super admin
// y Finanzas, vendedor).
export function InventoryGuideBar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const role: GuideRole = user?.role === "VENDEDOR" ? "vendedor" : "admin";
  const page = pageFromPath(pathname);
  const [open, setOpen] = useState(false);
  const { start, seen } = useInventoryTour(page, role, user?.email);

  if (!user) return null;
  const flow = FLOW[role];

  return (
    <>
      <div className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary/70" />
        <div className="flex min-w-0 items-start gap-3 pl-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Tour guiado — {PAGE_LABEL[page]}</p>
            <p className="text-sm text-muted-foreground">
              Un recorrido corto por esta pantalla: qué muestra cada parte y qué puedes hacer aquí.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-2.5 sm:pl-0">
          <Button type="button" size="sm" onClick={() => void start()} className="relative">
            <Play className="h-4 w-4" aria-hidden="true" />
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
                  size="icon-sm"
                  onClick={() => setOpen(true)}
                  aria-label="Más información: cómo funciona Inventario"
                />
              }
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>Más información: cómo funciona Inventario</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Cómo funciona Inventario</DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">{flow.intro}</DialogDescription>
          </DialogHeader>

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
              {PAGE_ORDER.map((key) => (
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
            Busca el ícono ⓘ junto a los encabezados de las tablas para ver qué significa cada dato, y usa el
            &quot;Tour de esta pantalla&quot; para un recorrido guiado.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
