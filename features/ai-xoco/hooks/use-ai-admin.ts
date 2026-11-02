"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAiKeys, fetchAiUsage, removeAiKey, saveAiKey, testAiKey } from "../api/ai-admin.api";
import type { AiProviderKey } from "../types/ai-chat.types";
import type { AiKeyInfo, AiUsageFilters } from "../types/ai-admin.types";

const KEYS = ["ai-chat", "keys"] as const;

export function useAiKeys() {
  return useQuery({ queryKey: KEYS, queryFn: fetchAiKeys });
}

// Al cambiar una llave también cambia qué IA está disponible en el chat.
function useApplyKeys() {
  const queryClient = useQueryClient();
  return (keys: AiKeyInfo[]) => {
    queryClient.setQueryData(KEYS, keys);
    void queryClient.invalidateQueries({ queryKey: ["ai-chat", "config"] });
  };
}

export function useSaveAiKey() {
  const apply = useApplyKeys();
  return useMutation({
    mutationFn: ({ provider, apiKey }: { provider: AiProviderKey; apiKey: string }) => saveAiKey(provider, apiKey),
    onSuccess: (result) => apply(result.keys),
  });
}

export function useTestAiKey() {
  const apply = useApplyKeys();
  return useMutation({
    mutationFn: (provider: AiProviderKey) => testAiKey(provider),
    onSuccess: (result) => apply(result.keys),
  });
}

export function useRemoveAiKey() {
  const apply = useApplyKeys();
  return useMutation({ mutationFn: (provider: AiProviderKey) => removeAiKey(provider), onSuccess: apply });
}

export function useAiUsage(filters: AiUsageFilters) {
  return useQuery({
    queryKey: ["ai-chat", "usage", filters],
    queryFn: () => fetchAiUsage(filters),
    placeholderData: keepPreviousData,
  });
}
