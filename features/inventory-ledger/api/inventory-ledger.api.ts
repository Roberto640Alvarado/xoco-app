import { apiGet } from "@/lib/api/client";
import type { InventoryLedgerEntry, InventoryLedgerFilters } from "../types/inventory-ledger.types";

export function fetchInventoryLedger({ posConfigId, ...params }: InventoryLedgerFilters) {
  return apiGet<InventoryLedgerEntry[]>(`/inventory/stores/${posConfigId}/ledger`, { params });
}
