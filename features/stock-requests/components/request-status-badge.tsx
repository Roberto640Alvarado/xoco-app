import { InfoBadge } from "@/design-system/components/info-badge";
import { ProgressSteps } from "@/design-system/components/progress-steps";
import { FLOW_STEPS, STATUS_LABEL, STATUS_TONE } from "../lib/request-status";
import type { StockRequest, StockRequestStatus } from "../types/stock-request.types";

export function RequestStatusBadge({ status }: { status: StockRequestStatus }) {
  return (
    <InfoBadge tone={STATUS_TONE[status]} dot>
      {STATUS_LABEL[status]}
    </InfoBadge>
  );
}

// Avance de la solicitud. Una cancelada marca en rojo el último paso al que llegó.
export function RequestProgress({ request, compact = false }: { request: StockRequest; compact?: boolean }) {
  const failed = request.status === "CANCELADA";
  let currentIndex: number;
  if (failed) {
    const reached = request.events
      .filter((event) => event.status !== "CANCELADA")
      .map((event) => FLOW_STEPS.findIndex((step) => step.status === event.status));
    currentIndex = Math.max(0, ...reached);
  } else {
    currentIndex = FLOW_STEPS.findIndex((step) => step.status === request.status);
  }
  return (
    <ProgressSteps
      steps={FLOW_STEPS.map((step) => ({ key: step.status, label: step.label }))}
      currentIndex={currentIndex}
      failed={failed}
      compact={compact}
    />
  );
}
