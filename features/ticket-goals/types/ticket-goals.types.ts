export interface TicketGoalSummaryItem {
  posConfigId: number;
  storeName: string;
  year: number;
  month: number;
  growthPercent: number | null;
  actualAverageTicket: number;
  targetAverageTicket: number | null;
  difference: number | null;
  reachPercent: number | null;
  isCurrentMonth: boolean;
}

export interface StoreTicketGoal {
  id: string;
  posConfigId: number;
  year: number;
  month: number;
  growthPercent: number;
  updatedAt: string;
}

export interface TicketGoalEntry {
  posConfigId: number;
  growthPercent: number;
}

export interface UpsertTicketGoalsBulkPayload {
  year: number;
  month: number;
  entries: TicketGoalEntry[];
}
