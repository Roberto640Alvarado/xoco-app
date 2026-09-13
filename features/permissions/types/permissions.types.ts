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

// Grupos de moduleKey que en el backend comparten un mismo endpoint —
// dentro de un grupo, apagar UNO SOLO no bloquea el dato en el servidor
// mientras al menos otro del mismo grupo siga prendido (ver
// ModuleAccessGuard / @RequiresModule, que acepta varias llaves y
// permite si alguna sigue habilitada). Un mismo moduleKey puede
// pertenecer a más de un grupo a la vez: "dashboard.trafico-diario",
// "dashboard.venta-diaria" y "dashboard.ticket-detallado" son cada uno
// compañeros tanto del grupo de 5 de GET /sales/daily-summary como del
// par mensual/diario que respalda su propio GET .../summary de metas.
export const SHARED_MODULE_GROUPS: ModuleKey[][] = [
  // GET /sales/daily-summary — Resumen, Visitas, Tráfico diario, Venta
  // diaria y Ticket detallado son 5 pantallas distintas sobre el mismo
  // dato crudo.
  [
    "dashboard.resumen",
    "dashboard.visitas",
    "dashboard.trafico-diario",
    "dashboard.venta-diaria",
    "dashboard.ticket-detallado",
  ],
  // GET /goals/summary — la vista "diaria" también pinta la meta
  // mensual dentro del mismo widget.
  ["dashboard.trafico-tiendas", "dashboard.trafico-diario"],
  // GET /sales-goals/summary
  ["dashboard.venta-mensual", "dashboard.venta-diaria"],
  // GET /ticket-goals/summary
  ["dashboard.ticket-promedio", "dashboard.ticket-detallado"],
];

// Unión de todos los "compañeros" de un moduleKey a través de TODOS los
// grupos a los que pertenece (puede estar en más de uno a la vez) — usado
// para mostrar el tooltip/nota correctos en el panel de Permisos sin
// duplicar esta lógica en el componente.
export function getSharedPeers(moduleKey: ModuleKey): ModuleKey[] {
  const peers = new Set<ModuleKey>();
  for (const group of SHARED_MODULE_GROUPS) {
    if (!group.includes(moduleKey)) continue;
    for (const key of group) {
      if (key !== moduleKey) peers.add(key);
    }
  }
  return Array.from(peers);
}

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
