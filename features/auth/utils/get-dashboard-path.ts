import type { UserRole } from "../types/auth.types";

// Pantalla de inicio de cada rol. SUPER_ADMIN, FINANZAS y VENDEDOR comparten
// un solo panel (/dashboard): la UI se ajusta según el rol en vez de vivir en
// árboles de rutas separados (a diferencia de ecoguide-app, que sí separa
// /student vs /teacher). PLANTA solo ve Inventario → Solicitudes, así que
// aterriza directo ahí. Ver CLAUDE.md, "Autorización".
export const PLANTA_HOME_PATH = "/dashboard/inventario/solicitudes";

export function getDashboardPath(role?: UserRole | null): string {
  return role === "PLANTA" ? PLANTA_HOME_PATH : "/dashboard";
}
