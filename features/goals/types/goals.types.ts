export interface GoalSummaryItem {
  posConfigId: number;
  storeName: string;
  year: number;
  month: number;
  growthPercent: number | null;
  previousMonthActualOrders: number;
  targetOrders: number | null;
  actualOrders: number;
  reachPercent: number | null;
  missingOrders: number | null;
  dailyNeededOrders: number | null;
  isCurrentMonth: boolean;
  daysElapsed: number;
  daysInMonth: number;
  projectedOrders: number;
  projectedReachPercent: number | null;
  updatedAt: string | null;
  updatedByEmail: string | null;
}

export interface StoreGoal {
  id: string;
  posConfigId: number;
  year: number;
  month: number;
  growthPercent: number;
  updatedAt: string;
}

export interface GoalEntry {
  posConfigId: number;
  growthPercent: number;
}

export interface UpsertGoalsBulkPayload {
  year: number;
  month: number;
  entries: GoalEntry[];
}
