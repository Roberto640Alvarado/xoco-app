// xoco-api hoy devuelve el payload directamente (sin envelope
// {status,message,data} como ecoguide-api) — ver plan-history de
// xoco-api. Este tipo es solo para el shape de error que sí normalizamos
// en el cliente axios (ver lib/api/client.ts).
export interface ApiErrorResponse {
  message: string | string[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
