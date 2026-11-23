import { apiClient, apiGet } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { AiChatConfig, AiChatEvent, AiConversationDetail, AiConversationSummary, AiProviderKey, PendingAttachment } from "../types/ai-chat.types";

export function fetchAiChatConfig() {
  return apiGet<AiChatConfig>("/ai-chat/config");
}

export function fetchConversations(search?: string) {
  return apiGet<AiConversationSummary[]>("/ai-chat/conversations", { params: search ? { search } : undefined });
}

export function fetchConversation(id: string) {
  return apiGet<AiConversationDetail>(`/ai-chat/conversations/${id}`);
}

export function renameConversation(id: string, title: string) {
  return apiClient.patch<AiConversationSummary>(`/ai-chat/conversations/${id}`, { title }).then((res) => res.data);
}

export function deleteConversation(id: string) {
  return apiClient.delete(`/ai-chat/conversations/${id}`).then(() => undefined);
}

/**
 * Un archivo adjunto de un chat (imagen, PDF o texto). Se pide con fetch y
 * el token en el header (un <img src> no puede mandarlo) y se devuelve como
 * Blob para mostrarlo con un object URL.
 */
export async function fetchAttachmentBlob(conversationId: string, attachmentId: string): Promise<Blob> {
  const { accessToken } = useAuthStore.getState();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-chat/conversations/${conversationId}/attachments/${attachmentId}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok) throw new Error("No se pudo abrir el archivo.");
  return response.blob();
}

export interface StreamChatInput {
  provider: AiProviderKey;
  conversationId?: string;
  message: string;
  attachments?: PendingAttachment[];
  signal: AbortSignal;
  onEvent: (event: AiChatEvent) => void;
}

// POST /ai-chat/stream con fetch (axios no lee streams): el servidor manda
// eventos "data: {...}" (text/event-stream) mientras la IA trabaja, y guarda
// la pregunta y la respuesta en el chat. El token sale del store en memoria.
export async function streamAiChat({ provider, conversationId, message, attachments = [], signal, onEvent }: StreamChatInput): Promise<void> {
  const { accessToken } = useAuthStore.getState();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-chat/stream`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      provider,
      message,
      ...(conversationId ? { conversationId } : {}),
      ...(attachments.length ? { attachments: attachments.map(({ name, mimeType, data }) => ({ name, mimeType, data })) } : {}),
    }),
  });

  if (!response.ok || !response.body) {
    let errorMessage =
      response.status === 413 ? "Los archivos pesan demasiado para enviarlos juntos." : `No se pudo consultar Xoco IA (${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) errorMessage = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    } catch {
      // sin cuerpo JSON
    }
    onEvent({ type: "error", message: errorMessage });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = chunk
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (data) {
        try {
          onEvent(JSON.parse(data) as AiChatEvent);
        } catch {
          // evento incompleto o latido: se ignora
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}
