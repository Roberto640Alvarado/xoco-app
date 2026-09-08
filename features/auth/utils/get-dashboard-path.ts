// Un solo panel compartido para ambos roles (SUPER_ADMIN y FINANZAS) — la
// UI dentro de /dashboard se ajusta según el rol en vez de vivir en árboles
// de rutas separados (a diferencia de ecoguide-app, que sí separa
// /student vs /teacher). Ver CLAUDE.md, "Autorización".
export function getDashboardPath(): string {
  return "/dashboard";
}
