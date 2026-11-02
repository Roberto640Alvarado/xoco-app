// Mismo contrato que GET /sales/today (xoco-api, TodaySalesService).
export interface TodayHour {
  hour: number;
  total: number;
  orders: number;
  lastWeekTotal: number;
}

export interface TodaySummary {
  total: number;
  orders: number;
  averageTicket: number;
  lastWeekToNow: number;
  changePct: number | null;
  lastOrderTime: string | null;
  bestHour: number | null;
  byHour: TodayHour[];
}

export interface TodayStore extends TodaySummary {
  posConfigId: number;
  storeName: string;
}

export interface TodaySales {
  date: string;
  lastWeekDate: string;
  asOf: string;
  totals: TodaySummary;
  stores: TodayStore[];
}

// GET /inventory/requests/summary (StockRequestsSummaryService).
export interface PlantSummaryStore {
  posConfigId: number;
  storeName: string;
  today: number;
  pending: number;
  onTheWay: number;
  recent: number;
  units: number;
}

export interface PlantSummary {
  date: string;
  totals: { today: number; pending: number; onTheWay: number; receivedToday: number; recent: number };
  stores: PlantSummaryStore[];
  byDay: { date: string; total: number; byStore: Record<string, number> }[];
}
