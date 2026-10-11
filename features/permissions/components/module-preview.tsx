import { Lock } from "lucide-react";
import { cn } from "cn";
import type { PreviewKind } from "../constants/module-info";

const BAR_HEIGHTS = [40, 62, 48, 80, 58, 90, 70, 52];

function Bone({ className }: { className?: string }) {
  return <div className={cn("rounded bg-foreground/10", className)} />;
}

function Chart() {
  return (
    <div className="flex h-24 items-end gap-1.5 rounded-lg border border-border bg-card p-2">
      {BAR_HEIGHTS.map((height, index) => (
        <div key={index} className="flex-1 rounded-t bg-primary/30" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function Table() {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2">
      <Bone className="h-2.5 w-full bg-foreground/15" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-2">
          <Bone className="h-2 w-1/3" />
          <Bone className="h-2 flex-1" />
          <Bone className="h-2 w-1/6" />
        </div>
      ))}
    </div>
  );
}

function Ranking() {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2">
      {[90, 72, 58, 40, 28].map((width, index) => (
        <div key={index} className="flex items-center gap-2">
          <Bone className="h-2 w-1/5" />
          <div className="h-2 rounded bg-primary/30" style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}

function Kpis() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2">
          <Bone className="h-1.5 w-1/2" />
          <Bone className="h-3 w-3/4 bg-foreground/20" />
        </div>
      ))}
    </div>
  );
}

interface ModulePreviewProps {
  kind: PreviewKind;
  /** Si el rol no tiene acceso, la vista previa se apaga y muestra un candado. */
  locked: boolean;
  lockedLabel: string;
}

/**
 * Vista previa ilustrativa de una pantalla: la forma general (filtros, tarjetas,
 * gráfica o tabla), no los datos reales. Si el rol no tiene acceso se atenúa y
 * muestra un candado.
 */
export function ModulePreview({ kind, locked, lockedLabel }: ModulePreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-muted/40 p-3" role="img" aria-label={locked ? lockedLabel : "Vista previa ilustrativa de la pantalla"}>
      <div className={cn("flex flex-col gap-2 transition-opacity", locked && "opacity-35 grayscale")}>
        <div className="flex items-center gap-1.5">
          <Bone className="size-3 rounded-full bg-primary/40" />
          <Bone className="h-2.5 w-24 bg-foreground/20" />
          <div className="ml-auto flex gap-1.5">
            <Bone className="h-4 w-12" />
            <Bone className="h-4 w-12" />
          </div>
        </div>
        {kind === "kpis" && (
          <>
            <Kpis />
            <Chart />
          </>
        )}
        {kind === "chart" && (
          <>
            <Chart />
            <Table />
          </>
        )}
        {kind === "table" && <Table />}
        {kind === "ranking" && (
          <>
            <Ranking />
            <Table />
          </>
        )}
      </div>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
            <Lock className="size-3.5" aria-hidden="true" />
            {lockedLabel}
          </span>
        </div>
      )}
    </div>
  );
}
