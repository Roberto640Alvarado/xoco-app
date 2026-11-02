import { apiClient, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { AiProviderKey } from "../types/ai-chat.types";
import type { AiKeyCheckResult, AiKeyInfo, AiUsageFilters, AiUsageResponse } from "../types/ai-admin.types";

export function fetchAiKeys() {
  return apiGet<AiKeyInfo[]>("/ai-chat/keys");
}

export function saveAiKey(provider: AiProviderKey, apiKey: string) {
  return apiPut<AiKeyCheckResult>(`/ai-chat/keys/${provider}`, { apiKey });
}

export function testAiKey(provider: AiProviderKey) {
  return apiPost<AiKeyCheckResult>(`/ai-chat/keys/${provider}/test`);
}

export function removeAiKey(provider: AiProviderKey) {
  return apiClient.delete<AiKeyInfo[]>(`/ai-chat/keys/${provider}`).then((res) => res.data);
}

export function fetchAiUsage(filters: AiUsageFilters) {
  return apiGet<AiUsageResponse>("/ai-chat/usage", { params: filters });
}
