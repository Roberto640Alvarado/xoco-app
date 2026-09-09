export interface GoalSummaryItem {
  posConfigId: number;
  storeName: string;
  year: number;
  month: number;
  targetOrders: number | null;
  actualOrders: number;
  reachPercent: number | null;
  isCurrentMonth: boolean;
  daysElapsed: number;
  daysInMonth: number;
  projectedOrders: number;
  projectedReachPercent: number | null;
}

export interface StoreGoal {
  id: string;
  posConfigId: number;
  year: number;
  month: number;
  targetOrders: number;
  updatedAt: string;
}

export interface UpsertGoalPayload {
  posConfigId: number;
  year: number;
  month: number;
  targetOrders: number;
}
