import type { UserRole } from "../types/auth.types";

// Pantalla de inicio de cada rol. SUPER_ADMIN, FINANZAS y VENDEDOR comparten
// un solo panel (/dashboard): la UI se ajusta según el rol en vez de vivir en
// árboles de rutas separados (a diferencia de ecoguide-app, que sí separa
// /student vs /teacher). PLANTA solo ve Inventario → Solicitudes, así que
// aterriza directo ahí. Ver CLAUDE.md, "Autorización".
export const PLANTA_HOME_PATH = "/dashboard/inventario/solicitudes";

// Todos los roles aterrizan en Inicio (saludo, pendientes, accesos y
// novedades según el rol). PLANTA_HOME_PATH queda como su pantalla principal.
export const HOME_PATH = "/dashboard/inicio";

export function getDashboardPath(role?: UserRole | null): string {
  void role;
  return HOME_PATH;
}
