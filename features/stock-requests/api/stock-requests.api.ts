import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type {
  StockRequestSource,
  CreateStockRequestPayload,
  ReceiveStockRequestPayload,
  SavePlantResponsePayload,
  StockRequest,
  StockRequestCatalogItem,
  StockRequestFilters,
  StockRequestNotifications,
} from "../types/stock-request.types";

const BASE = "/inventory/requests";

export function fetchStockRequests(filters: StockRequestFilters) {
  return apiGet<StockRequest[]>(BASE, { params: filters });
}

export function fetchStockRequest(id: string) {
  return apiGet<StockRequest>(`${BASE}/${id}`);
}

export function fetchStockRequestCatalog() {
  return apiGet<StockRequestCatalogItem[]>(`${BASE}/catalog`);
}

export function fetchStockRequestNotifications() {
  return apiGet<StockRequestNotifications>(`${BASE}/notifications`);
}

export function createStockRequest(payload: CreateStockRequestPayload) {
  return apiPost<StockRequest>(BASE, payload);
}

export function startStockRequest(id: string) {
  return apiPatch<StockRequest>(`${BASE}/${id}/start`);
}

export function saveStockRequestResponse(id: string, payload: SavePlantResponsePayload) {
  return apiPut<StockRequest>(`${BASE}/${id}/response`, payload);
}

export function dispatchStockRequest(id: string, payload: SavePlantResponsePayload) {
  return apiPost<StockRequest>(`${BASE}/${id}/dispatch`, payload);
}

export function receiveStockRequest(id: string, payload: ReceiveStockRequestPayload) {
  return apiPatch<StockRequest>(`${BASE}/${id}/receive`, payload);
}

export function cancelStockRequest(id: string, reason: string) {
  return apiPatch<StockRequest>(`${BASE}/${id}/cancel`, { reason });
}

export function fetchStockRequestSources() {
  return apiGet<StockRequestSource[]>(`${BASE}/sources`);
}
