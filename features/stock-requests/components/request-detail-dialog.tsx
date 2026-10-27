"use client";

import { useState } from "react";
import { FileDown, Loader2, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const start = useStartStockRequest();

  const mode = request ? getRequestMode(role, request) : "view";

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
        <DialogContent className="flex max-h-[92vh] flex-col gap-4 overflow-hidden sm:max-w-3xl">
          {request && (
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
                <p className="text-sm text-foreground/80">{statusHint(role, request)}</p>
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
                  <PlantResponseEditor key={request.id} request={request} onDone={() => onOpenChange(false)} />
                ) : mode === "receive" ? (
                  <ReceiveEditor key={request.id} request={request} onDone={() => onOpenChange(false)} />
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
