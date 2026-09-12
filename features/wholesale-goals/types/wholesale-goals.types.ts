export interface WholesaleClient {
  key: string;
  label: string;
}

export interface WholesaleGoalSummaryItem {
  clientKey: string;
  clientLabel: string;
  year: number;
  month: number;
  growthPercent: number | null;
  actualRevenue: number;
  targetRevenue: number | null;
  reachPercent: number | null;
  pendingValue: number | null;
  isCurrentMonth: boolean;
  updatedAt: string | null;
  updatedByEmail: string | null;
}

export interface WholesaleClientGoal {
  id: string;
  clientKey: string;
  year: number;
  month: number;
  growthPercent: number;
  updatedAt: string;
}

export interface WholesaleGoalEntry {
  clientKey: string;
  growthPercent: number;
}

export interface UpsertWholesaleGoalsBulkPayload {
  year: number;
  month: number;
  entries: WholesaleGoalEntry[];
}

// Desglose por comprador (partner_id de Odoo, ej. una sucursal de
// Selectos) — ver WholesaleClientTotalsService en xoco-api.
export interface WholesaleBuyerTotals {
  partnerId: number;
  partnerName: string;
  visits: number;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
}

export interface WholesaleClientTotals {
  clientKey: string;
  clientLabel: string;
  visits: number;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  buyers: WholesaleBuyerTotals[];
}

export interface WholesaleClientTotalsReport {
  items: WholesaleClientTotals[];
  totals: {
    visits: number;
    amountUntaxed: number;
    amountTax: number;
    amountTotal: number;
  };
}
