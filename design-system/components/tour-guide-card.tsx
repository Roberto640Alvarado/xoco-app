"use client";

import type { ReactNode } from "react";
import { Compass, Info, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TourGuideCardProps {
  /** Pastilla junto al título (ej. el rol de quien mira). */
  badge?: ReactNode;
  description?: string;
  onStart: () => void;
  /** Si viene, se muestra el botón ⓘ con esta etiqueta (tooltip y aria). */
  onInfo?: () => void;
  infoLabel?: string;
  /** Puntito de "tour sin ver" sobre el botón. */
  showNewDot?: boolean;
}

/**
 * Card del tour guiado: el título siempre es "Tour guiado". El botón de
 * iniciar es secundario (no compite con la acción principal de la pantalla)
 * y el ⓘ abre la explicación completa.
 */
export function TourGuideCard({
  badge,
  description = "Conoce esta pantalla paso a paso.",
  onStart,
  onInfo,
  infoLabel = "Más información",
  showNewDot = false,
}: TourGuideCardProps) {
  return (
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
            {badge}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={onStart} className="relative">
          <Play className="size-4" aria-hidden="true" />
          Iniciar tour
          {showNewDot && (
            <span className="absolute -right-1 -top-1 flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
            </span>
          )}
        </Button>
        {onInfo && (
          <Tooltip>
            <TooltipTrigger
              render={<Button type="button" variant="outline" size="icon" onClick={onInfo} aria-label={infoLabel} />}
            >
              <Info className="size-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>{infoLabel}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </section>
  );
}
