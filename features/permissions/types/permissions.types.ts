import type { UserRole } from "@/features/auth/types/auth.types";

// Mismo catálogo de 14 moduleKey del backend
// (xoco-api/src/common/constants/module-keys.const.ts) — duplicado a
// mano, mismo criterio ya usado en el proyecto para ROLE_LABEL, etc.
// Administración NUNCA tiene moduleKey — queda fuera de este catálogo
// por completo, así SUPER_ADMIN nunca puede perder ese acceso desde
// este mismo panel.
export const MODULE_KEYS = [
  "dashboard.resumen",
  "dashboard.visitas",
  "dashboard.trafico-diario",
  "dashboard.trafico-tiendas",
  "dashboard.venta-diaria",
  "dashboard.venta-mensual",
  "dashboard.efectivo-otros-medios",
  "dashboard.ventas-mayoreo",
  "dashboard.buscar-compradores",
  "dashboard.ticket-promedio",
  "dashboard.ticket-detallado",
  "dashboard.productos",
  "dashboard.categorias",
  "dashboard.cierre-mes",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

// Etiqueta legible por moduleKey — mismo texto que el label de cada
// NAV_ITEMS leaf en app/dashboard/layout.tsx.
export const MODULE_LABEL: Record<ModuleKey, string> = {
  "dashboard.resumen": "Resumen",
  "dashboard.visitas": "Visitas",
  "dashboard.trafico-diario": "Tráfico diario",
  "dashboard.trafico-tiendas": "Tráfico de tiendas",
  "dashboard.venta-diaria": "Venta diaria",
  "dashboard.venta-mensual": "Venta mensual",
  "dashboard.efectivo-otros-medios": "Formas de pago",
  "dashboard.ventas-mayoreo": "Ventas mayoreo",
  "dashboard.buscar-compradores": "Buscar compradores",
  "dashboard.ticket-promedio": "Ticket promedio",
  "dashboard.ticket-detallado": "Ticket detallado",
  "dashboard.productos": "Mejores productos",
  "dashboard.categorias": "Categorías",
  "dashboard.cierre-mes": "Cierre del mes",
};

// Los 5 moduleKey que en el backend comparten un mismo endpoint
// (GET /sales/daily-summary) — apagar uno solo de estos NO bloquea el
// dato en el servidor mientras los otros 4 sigan prendidos (ver
// ModuleAccessGuard / @RequiresModule). Se usa para mostrar una nota
// inline en el panel de Permisos.
export const SHARED_DAILY_SUMMARY_MODULE_KEYS: ModuleKey[] = [
  "dashboard.resumen",
  "dashboard.visitas",
  "dashboard.trafico-diario",
  "dashboard.venta-diaria",
  "dashboard.ticket-detallado",
];

export interface RoleModuleAccessRow {
  role: UserRole;
  moduleKey: ModuleKey;
  enabled: boolean;
  updatedAt: string | null;
  updatedByEmail: string | null;
}

export interface SetRoleModuleAccessPayload {
  role: UserRole;
  moduleKey: ModuleKey;
  enabled: boolean;
}
