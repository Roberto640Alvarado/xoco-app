"use client";

import { useState } from "react";
import { FileDown, Loader2, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "cn";
import { DeliveryTruck } from "@/design-system/components/delivery-truck";
import { SuccessCelebration } from "@/design-system/components/success-celebration";
import { SegmentedControl } from "@/design-system/components/segmented-control";
import { formatDateTime } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { useStartStockRequest } from "../hooks/use-stock-request-actions";
import { useStockRequest } from "../hooks/use-stock-requests";
import { canCancelRequest, getRequestMode, statusHint } from "../lib/request-status";
import { downloadRequestPdf } from "../lib/request-pdf";
import { CancelRequestDialog } from "./cancel-request-dialog";
import { PlantResponseEditor } from "./plant-response-editor";
import { ReceiveEditor } from "./receive-editor";
import { RequestLinesTable } from "./request-lines-table";
import { RequestProgress, RequestStatusBadge } from "./request-status-badge";
import { RequestTimeline } from "./request-timeline";
import type { StockRequest } from "../types/stock-request.types";

type Tab = "productos" | "seguimiento";

type Celebration = { requestId: string; kind: "dispatched" | "received"; storeName: string };

// Cuánto se ve la animación de "¡Va en camino!" / "¡Recibido!" antes de cerrar.
const CELEBRATION_MS = { dispatched: 2800, received: 2200 } as const;

interface RequestDetailDialogProps {
  /** Solicitud elegida en el tablero (null = cerrado). Sirve de dato inicial mientras llega la versión completa. */
  summary: StockRequest | null;
  onOpenChange: (open: boolean) => void;
}

// Detalle de una solicitud. Según quién mira y en qué estado está, el
// cuerpo es el editor de planta, la confirmación de la tienda o solo lectura.
export function RequestDetailDialog({ summary, onOpenChange }: RequestDetailDialogProps) {
  const role = useAuthStore((state) => state.user?.role);
  const { data } = useStockRequest(summary?.id ?? null);
  const request = data ?? summary;
  const [tab, setTab] = useState<Tab>("productos");
  const [cancelTarget, setCancelTarget] = useState<StockRequest | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const start = useStartStockRequest();

  const mode = request ? getRequestMode(role, request) : "view";
  // Solo cuenta la animación de ESTA solicitud (si se abre otra, no se arrastra).
  const activeCelebration = celebration && celebration.requestId === summary?.id ? celebration : null;

  function celebrate(kind: Celebration["kind"]) {
    if (!request) return;
    setCelebration({ requestId: request.id, kind, storeName: request.storeName });
    setTimeout(() => {
      setCelebration(null);
      onOpenChange(false);
    }, CELEBRATION_MS[kind]);
  }

  async function handlePdf() {
    if (!request) return;
    setPdfLoading(true);
    try {
      await downloadRequestPdf(request);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <>
      <Dialog open={summary !== null} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "flex max-h-[94vh] flex-col gap-4 overflow-hidden",
            mode === "plant" && !activeCelebration ? "w-[calc(100vw-1.5rem)] sm:max-w-6xl" : "sm:max-w-3xl",
          )}
        >
          {activeCelebration ? (
            activeCelebration.kind === "dispatched" ? (
              <SuccessCelebration
                visual={<DeliveryTruck mode="depart" size="lg" label="El camión sale de planta" />}
                title="¡Va en camino!"
                description={`A ${activeCelebration.storeName} ya le llegó el aviso. Ellos confirman cuando les llegue.`}
              />
            ) : (
              <SuccessCelebration title="¡Recibido!" description="Listo: el inventario de tu tienda ya se actualizó." />
            )
          ) : request && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {request.code} · {request.storeName}
                  </DialogTitle>
                  <RequestStatusBadge status={request.status} />
                </div>
                <DialogDescription className="leading-relaxed">
                  Pedida {formatDateTime(request.createdAt)} por {request.createdByEmail}
                  {request.note ? ` · “${request.note}”` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <RequestProgress request={request} />
                {request.status === "EN_CAMINO" && (
                  <DeliveryTruck size="md" label={`Envío en camino a ${request.storeName}`} />
                )}
                <p className="text-sm text-foreground/80">
                  {statusHint(role, request)}
                  {request.status === "EN_CAMINO" && request.dispatchedAt ? ` Salió de planta ${formatDateTime(request.dispatchedAt)}.` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {mode === "view" ? (
                  <SegmentedControl<Tab>
                    ariaLabel="Ver"
                    value={tab}
                    onChange={setTab}
                    options={[
                      { value: "productos", label: "Productos" },
                      { value: "seguimiento", label: "Seguimiento" },
                    ]}
                  />
                ) : (
                  <span className="text-sm font-medium text-foreground">{mode === "plant" ? "Tu respuesta" : "Confirma lo recibido"}</span>
                )}
                <div className="flex flex-wrap gap-2">
                  {mode === "plant" && request.status === "SOLICITADA" && (
                    <Button type="button" size="sm" variant="secondary" disabled={start.isPending} onClick={() => start.mutate({ id: request.id })}>
                      {start.isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Play className="size-3.5" aria-hidden="true" />}
                      Tomar solicitud
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={handlePdf} disabled={pdfLoading}>
                    {pdfLoading ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <FileDown className="size-3.5" aria-hidden="true" />}
                    PDF
                  </Button>
                  {canCancelRequest(role, request.status) && (
                    <Button type="button" size="sm" variant="outline" onClick={() => setCancelTarget(request)}>
                      <XCircle className="size-3.5" aria-hidden="true" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {start.isError && (
                <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {start.error.message}
                </div>
              )}

              <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
                {mode === "plant" ? (
                  <PlantResponseEditor key={request.id} request={request} onDispatched={() => celebrate("dispatched")} />
                ) : mode === "receive" ? (
                  <ReceiveEditor key={request.id} request={request} onDone={() => celebrate("received")} />
                ) : tab === "productos" ? (
                  <RequestLinesTable request={request} />
                ) : (
                  <RequestTimeline events={request.events} />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CancelRequestDialog
        request={cancelTarget}
        onOpenChange={(next) => {
          if (!next) setCancelTarget(null);
        }}
      />
    </>
  );
}
