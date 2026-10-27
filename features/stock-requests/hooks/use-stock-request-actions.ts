"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api/client";
import {
  cancelStockRequest,
  createStockRequest,
  dispatchStockRequest,
  receiveStockRequest,
  saveStockRequestResponse,
  startStockRequest,
} from "../api/stock-requests.api";
import type {
  CreateStockRequestPayload,
  ReceiveStockRequestPayload,
  SavePlantResponsePayload,
  StockRequest,
} from "../types/stock-request.types";

// Toda acción cambia la solicitud y los avisos del menú. Solo recibir
// toca además el inventario de la tienda (suma las entradas).
function useRequestMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<StockRequest>,
  options: { touchesInventory?: boolean } = {},
) {
  const queryClient = useQueryClient();
  return useMutation<StockRequest, ApiError, TVars>({
    mutationFn,
    onSuccess: (request) => {
      queryClient.setQueryData(["stock-requests", "detail", request.id], request);
      queryClient.invalidateQueries({ queryKey: ["stock-requests", "list"] });
      queryClient.invalidateQueries({ queryKey: ["stock-requests", "notifications"] });
      if (options.touchesInventory) {
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
      }
    },
  });
}

export function useCreateStockRequest() {
  return useRequestMutation<CreateStockRequestPayload>(createStockRequest);
}

export function useStartStockRequest() {
  return useRequestMutation<{ id: string }>(({ id }) => startStockRequest(id));
}

export function useSavePlantResponse() {
  return useRequestMutation<{ id: string; payload: SavePlantResponsePayload }>(({ id, payload }) =>
    saveStockRequestResponse(id, payload),
  );
}

export function useDispatchStockRequest() {
  return useRequestMutation<{ id: string; payload: SavePlantResponsePayload }>(({ id, payload }) =>
    dispatchStockRequest(id, payload),
  );
}

export function useReceiveStockRequest() {
  return useRequestMutation<{ id: string; payload: ReceiveStockRequestPayload }>(
    ({ id, payload }) => receiveStockRequest(id, payload),
    { touchesInventory: true },
  );
}

export function useCancelStockRequest() {
  return useRequestMutation<{ id: string; reason: string }>(({ id, reason }) => cancelStockRequest(id, reason));
}
