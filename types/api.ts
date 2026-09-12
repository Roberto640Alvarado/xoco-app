// xoco-api hoy devuelve el payload directamente (sin envelope
// {status,message,data} como ecoguide-api) — ver plan-history de
// xoco-api. Este tipo es solo para el shape de error que sí normalizamos
// en el cliente axios (ver lib/api/client.ts).
export interface ApiErrorResponse {
  message: string | string[];
  // Presente en el 403 de ModuleAccessGuard (panel "Permisos", Fase 3 de
  // RBAC) para distinguirlo de un 403 "no soy este rol" — ver
  // lib/api/client.ts.
  code?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
