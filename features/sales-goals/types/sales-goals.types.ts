export interface SalesGoalSummaryItem {
  posConfigId: number;
  storeName: string;
  year: number;
  month: number;
  growthPercent: number | null;
  actualRevenue: number;
  targetRevenue: number | null;
  reachPercent: number | null;
  pendingValue: number | null;
  isCurrentMonth: boolean;
}

export interface StoreSalesGoal {
  id: string;
  posConfigId: number;
  year: number;
  month: number;
  growthPercent: number;
  updatedAt: string;
}

export interface SalesGoalEntry {
  posConfigId: number;
  growthPercent: number;
}

export interface UpsertSalesGoalsBulkPayload {
  year: number;
  month: number;
  entries: SalesGoalEntry[];
}
