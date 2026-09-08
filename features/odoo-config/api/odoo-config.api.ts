import { apiClient, apiGet } from "@/lib/api/client";
import type { OdooConfigStatus, RotateOdooConfigPayload } from "../types/odoo-config.types";

export function fetchOdooConfig() {
  return apiGet<OdooConfigStatus | null>("/odoo/config");
}

// El backend expone PUT /odoo/config (crea o rota la config activa) — no
// hay helper apiPut en lib/api/client.ts todavía, se usa apiClient directo.
export function rotateOdooConfig(payload: RotateOdooConfigPayload) {
  return apiClient.put<OdooConfigStatus>("/odoo/config", payload).then((res) => res.data);
}
