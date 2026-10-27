import { CheckCircle2, CircleDot, PackageCheck, PackagePlus, Truck, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABEL, STATUS_LABEL } from "../lib/request-status";
import type { StockRequestEvent, StockRequestStatus } from "../types/stock-request.types";

const ICON: Record<StockRequestStatus, LucideIcon> = {
  SOLICITADA: PackagePlus,
  EN_PREPARACION: CircleDot,
  EN_CAMINO: Truck,
  RECIBIDA: PackageCheck,
  CANCELADA: XCircle,
};

const EVENT_TEXT: Record<StockRequestStatus, string> = {
  SOLICITADA: "La tienda hizo la solicitud",
  EN_PREPARACION: "Planta empezó a prepararla",
  EN_CAMINO: "Planta despachó el envío",
  RECIBIDA: "La tienda confirmó la recepción",
  CANCELADA: "Se canceló la solicitud",
};

/** Seguimiento: cada cambio de estado con quién y cuándo, del más reciente al más antiguo. */
export function RequestTimeline({ events }: { events: StockRequestEvent[] }) {
  const ordered = [...events].reverse();
  return (
    <ol className="flex flex-col">
      {ordered.map((event, index) => {
        const Icon = ICON[event.status] ?? CheckCircle2;
        const isLast = index === ordered.length - 1;
        const cancelled = event.status === "CANCELADA";
        return (
          <li key={`${event.status}-${event.at}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  cancelled ? "bg-destructive/10 text-destructive" : index === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              {!isLast && <span className="my-1 w-px flex-1 bg-border" aria-hidden="true" />}
            </div>
            <div className={cn("min-w-0 pb-4", isLast && "pb-0")}>
              <p className="text-sm font-medium text-foreground">
                {EVENT_TEXT[event.status]} <span className="font-normal text-muted-foreground">· {STATUS_LABEL[event.status]}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(event.at)} · {ROLE_LABEL[event.byRole]} ({event.byEmail})
              </p>
              {event.note && <p className="mt-0.5 text-sm text-foreground/80">“{event.note}”</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
