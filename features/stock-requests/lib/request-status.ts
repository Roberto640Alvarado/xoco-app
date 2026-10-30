import type { InfoBadgeTone } from "@/design-system/components/info-badge";
import type { StockRequest, StockRequestRole, StockRequestStatus } from "../types/stock-request.types";

export const STATUS_LABEL: Record<StockRequestStatus, string> = {
  SOLICITADA: "Solicitada",
  EN_PREPARACION: "En preparación",
  EN_CAMINO: "En camino",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada",
};

// warning = espera a quien surte, info = preparándose, violet = en tránsito,
// success = listo, danger = cancelada (mismos tonos del resto del panel).
export const STATUS_TONE: Record<StockRequestStatus, InfoBadgeTone> = {
  SOLICITADA: "warning",
  EN_PREPARACION: "info",
  EN_CAMINO: "violet",
  RECIBIDA: "success",
  CANCELADA: "danger",
};

export const STATUS_ORDER: StockRequestStatus[] = ["SOLICITADA", "EN_PREPARACION", "EN_CAMINO", "RECIBIDA", "CANCELADA"];

/** Pasos del camino feliz, en orden (la cancelada no es un paso). */
export const FLOW_STEPS: { status: StockRequestStatus; label: string }[] = [
  { status: "SOLICITADA", label: "Solicitada" },
  { status: "EN_PREPARACION", label: "En preparación" },
  { status: "EN_CAMINO", label: "En camino" },
  { status: "RECIBIDA", label: "Recibida" },
];

export const ROLE_LABEL: Record<StockRequestRole, string> = {
  SUPER_ADMIN: "Admin",
  FINANZAS: "Finanzas",
  VENDEDOR: "Tienda",
  PLANTA: "Planta",
};

/** Quién mira: su rol y, si es Vendedor, su tienda. */
export interface Viewer {
  role?: string;
  posConfigId?: number | null;
}

export const isStoreTransfer = (request: StockRequest) => request.sourcePosConfigId !== null;

/** ¿Quien mira es quien surte esta solicitud? Planta para las de planta; la tienda origen en las de entre tiendas. */
export function isSupplier(viewer: Viewer, request: StockRequest): boolean {
  if (!isStoreTransfer(request)) return viewer.role === "PLANTA";
  return viewer.role === "VENDEDOR" && viewer.posConfigId === request.sourcePosConfigId;
}

/** ¿Quien mira es la tienda que pidió? */
export function isRequester(viewer: Viewer, request: StockRequest): boolean {
  return viewer.role === "VENDEDOR" && viewer.posConfigId === request.posConfigId;
}

/** Qué puede hacer quien mira: responderla (quien surte), confirmar lo recibido (la tienda que pidió) o solo verla. */
export type RequestMode = "plant" | "receive" | "view";

export function getRequestMode(viewer: Viewer, request: StockRequest): RequestMode {
  if (isSupplier(viewer, request) && (request.status === "SOLICITADA" || request.status === "EN_PREPARACION")) return "plant";
  if (isRequester(viewer, request) && request.status === "EN_CAMINO") return "receive";
  return "view";
}

export function canCancelRequest(viewer: Viewer, request: StockRequest): boolean {
  const { status } = request;
  // Entre tiendas, una vez despachada ya salió del inventario de la que surte.
  if (isStoreTransfer(request) && status === "EN_CAMINO") return false;
  if (isSupplier(viewer, request)) return status === "SOLICITADA" || status === "EN_PREPARACION";
  if (viewer.role === "VENDEDOR") return status === "SOLICITADA";
  if (viewer.role === "SUPER_ADMIN" || viewer.role === "FINANZAS") return status !== "RECIBIDA" && status !== "CANCELADA";
  return false;
}

/** ¿Esta solicitud espera algo de quien mira? (para destacarla en el tablero). */
export function needsMyAction(viewer: Viewer, request: StockRequest): boolean {
  return getRequestMode(viewer, request) !== "view";
}

/** Una frase corta: en qué paso está y qué sigue, según quién mira. */
export function statusHint(viewer: Viewer, request: StockRequest): string {
  const supplier = isSupplier(viewer, request);
  const requester = isRequester(viewer, request);
  const from = isStoreTransfer(request) ? request.sourceName : "planta";
  switch (request.status) {
    case "SOLICITADA":
      if (supplier) return isStoreTransfer(request) ? `${request.storeName} te pide productos: revisa qué tienes.` : "Nueva: revisa qué hay y qué no.";
      if (requester) return `${capitalize(from)} aún no la toma.`;
      return `Esperando a ${from}.`;
    case "EN_PREPARACION":
      if (supplier) return "La estás preparando: marca qué hay y despacha.";
      return `${capitalize(from)} la está preparando.`;
    case "EN_CAMINO":
      if (requester)
        return request.dispatch === "PARCIAL"
          ? "Viene en camino, pero incompleto. Confirma lo que llegue."
          : "Viene en camino. Confirma cuando llegue.";
      if (supplier) return `Despachada: esperando que ${request.storeName} la reciba.`;
      return `En camino a ${request.storeName}.`;
    case "RECIBIDA":
      return isStoreTransfer(request)
        ? `${request.storeName} confirmó la recepción: se sumó a su inventario y se restó del de ${request.sourceName}.`
        : "La tienda confirmó la recepción y el inventario ya se actualizó.";
    case "CANCELADA":
      return request.cancelReason ? `Cancelada: ${request.cancelReason}` : "Cancelada.";
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
