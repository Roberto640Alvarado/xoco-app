import type { InfoBadgeTone } from "@/design-system/components/info-badge";
import type { StockRequest, StockRequestRole, StockRequestStatus } from "../types/stock-request.types";

export const STATUS_LABEL: Record<StockRequestStatus, string> = {
  SOLICITADA: "Solicitada",
  EN_PREPARACION: "En preparación",
  EN_CAMINO: "En camino",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada",
};

// warning = espera a planta, info = planta trabajando, violet = en tránsito,
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

/** Qué puede hacer quien mira la solicitud: responderla (planta), confirmar lo recibido (tienda) o solo verla. */
export type RequestMode = "plant" | "receive" | "view";

export function getRequestMode(role: string | undefined, request: StockRequest): RequestMode {
  if (role === "PLANTA" && (request.status === "SOLICITADA" || request.status === "EN_PREPARACION")) return "plant";
  if (role === "VENDEDOR" && request.status === "EN_CAMINO") return "receive";
  return "view";
}

export function canCancelRequest(role: string | undefined, status: StockRequestStatus): boolean {
  if (role === "VENDEDOR") return status === "SOLICITADA";
  if (role === "PLANTA") return status === "SOLICITADA" || status === "EN_PREPARACION";
  if (role === "SUPER_ADMIN" || role === "FINANZAS") return status !== "RECIBIDA" && status !== "CANCELADA";
  return false;
}

/** ¿Esta solicitud espera algo de quien mira? (para destacarla en el tablero). */
export function needsMyAction(role: string | undefined, request: StockRequest): boolean {
  return getRequestMode(role, request) !== "view";
}

/** Una frase corta: en qué paso está y qué sigue, según quién mira. */
export function statusHint(role: string | undefined, request: StockRequest): string {
  const isStore = role === "VENDEDOR";
  const isPlant = role === "PLANTA";
  switch (request.status) {
    case "SOLICITADA":
      if (isPlant) return "Nueva: revisa qué hay y qué no.";
      if (isStore) return "Planta aún no la toma.";
      return "Esperando a planta.";
    case "EN_PREPARACION":
      if (isPlant) return "La estás preparando: marca qué hay y despacha.";
      if (isStore) return "Planta la está preparando.";
      return "Planta la está preparando.";
    case "EN_CAMINO":
      if (isStore)
        return request.dispatch === "PARCIAL"
          ? "Viene en camino, pero incompleto. Confirma lo que llegue."
          : "Viene en camino. Confirma cuando llegue.";
      if (isPlant) return "Despachada: esperando que la tienda la reciba.";
      return "En camino a la tienda.";
    case "RECIBIDA":
      return "La tienda confirmó la recepción y el inventario ya se actualizó.";
    case "CANCELADA":
      return request.cancelReason ? `Cancelada: ${request.cancelReason}` : "Cancelada.";
  }
}
