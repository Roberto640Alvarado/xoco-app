import { apiGet } from "@/lib/api/client";
import type { PlantSummary, TodaySales } from "../types/today-sales.types";

export function fetchTodaySales() {
  return apiGet<TodaySales>("/sales/today");
}

export function fetchPlantSummary() {
  return apiGet<PlantSummary>("/inventory/requests/summary");
}
