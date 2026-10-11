"use client";

import { useMemo, useState } from "react";
import { InfoBadge } from "@/design-system/components/info-badge";
import { TourGuideCard } from "@/design-system/components/tour-guide-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { guideRoleFor, ROLE_LABEL } from "@/features/inventory-guide/content";
import { useAuthStore } from "@/store/auth-store";
import { canOpen, permissionsFor, REPORT_GUIDES, tourStepsFor, type ReportPageKey } from "../content";
import { useGuideTour } from "../hooks/use-guide-tour";
import { ROLE_TONE, RolePermissions } from "./role-permissions";

interface PageGuideBarProps {
  page: ReportPageKey;
}

// Card del tour guiado de una sección de reportes: "Iniciar tour" lanza el
// recorrido de la pantalla y el ⓘ abre un modal con qué es la pantalla, qué
// puede (y qué no) hacer el rol de quien mira y qué hay en cada bloque. Todo
// el contenido sale de content.ts según el rol; si el rol no puede abrir la
// pantalla, no se muestra nada.
export function PageGuideBar({ page }: PageGuideBarProps) {
  const user = useAuthStore((state) => state.user);
  const role = guideRoleFor(user?.role);
  const [open, setOpen] = useState(false);

  const steps = useMemo(() => tourStepsFor(page, role), [page, role]);
  const { start, seen } = useGuideTour(`report:${page}`, steps, user?.email);

  if (!user || !canOpen(page, role)) return null;

  const guide = REPORT_GUIDES[page];
  const permissions = permissionsFor(page, role);
  const [intro, ...parts] = steps;

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
        infoLabel={`Cómo funciona ${guide.title}`}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
              {guide.title}
              <InfoBadge tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</InfoBadge>
            </DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">{intro.description}</DialogDescription>
          </DialogHeader>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Tu rol: {ROLE_LABEL[role]}</h3>
            <RolePermissions can={permissions.can} cannot={permissions.cannot} />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Qué hay en esta pantalla</h3>
            <ul className="flex flex-col gap-2">
              {parts.map((step) => (
                <li key={step.title + step.description} className="rounded-lg border border-border bg-card px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-muted-foreground">Usa &quot;Iniciar tour&quot; para un recorrido guiado de la pantalla.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
