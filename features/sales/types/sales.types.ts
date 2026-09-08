export interface Store {
  id: number;
  name: string;
}

export interface DailySalesPoint {
  date: string; // YYYY-MM-DD
  orderCount: number;
  totalRevenue: number;
  totalTax: number;
}

export type ProductRankOrder = "desc" | "asc";

export interface TopProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface SalesFilters {
  dateFrom: string;
  dateTo: string;
  posConfigId?: number;
}
