import { ArrowRight, Boxes, Clock, Store } from "lucide-react";
import { cn } from "cn";
import { formatDateTime } from "@/lib/format";
import { needsMyAction, statusHint } from "../lib/request-status";
import { RequestProgress, RequestStatusBadge } from "./request-status-badge";
import type { StockRequest } from "../types/stock-request.types";

interface RequestCardProps {
  request: StockRequest;
  role: string | undefined;
  onOpen: (request: StockRequest) => void;
}

// Tarjeta del tablero. Las que esperan una acción de quien mira (responder,
// confirmar recepción) se destacan con el borde de color y una etiqueta.
export function RequestCard({ request, role, onOpen }: RequestCardProps) {
  const action = needsMyAction(role, request);
  const categories = new Set(request.lines.map((line) => line.categoryName)).size;
  const lineCount = request.lines.length;

  return (
    <button
      type="button"
      onClick={() => onOpen(request)}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-card p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        action ? "border-primary/60 ring-1 ring-primary/20" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold text-foreground">{request.code}</p>
          <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
            <Store className="size-3.5 shrink-0" aria-hidden="true" />
            {request.storeName}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      <RequestProgress request={request} compact />

      <p className="line-clamp-2 min-h-10 text-sm text-foreground/80">{statusHint(role, request)}</p>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Boxes className="size-3.5" aria-hidden="true" />
          {lineCount} producto{lineCount === 1 ? "" : "s"} · {categories} categoría{categories === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" />
          {formatDateTime(request.updatedAt)}
        </span>
      </div>

      <span
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold",
          action ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground",
        )}
      >
        {action ? (role === "PLANTA" ? "Responder y despachar" : "Confirmar recepción") : "Ver detalle"}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </button>
  );
}
