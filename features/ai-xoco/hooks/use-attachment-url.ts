"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAttachmentBlob } from "../api/ai-chat.api";
import type { ChatAttachment } from "../types/ai-chat.types";

/**
 * URL para mostrar un adjunto: la vista previa local si existe; si no, el
 * archivo guardado en el servidor como object URL (con el token en el header).
 */
export function useAttachmentUrl(conversationId: string | null, attachment: ChatAttachment, enabled = true) {
  const query = useQuery({
    queryKey: ["ai-chat", "attachment", attachment.id],
    queryFn: async () => URL.createObjectURL(await fetchAttachmentBlob(conversationId as string, attachment.id as string)),
    enabled: enabled && !attachment.previewUrl && Boolean(conversationId && attachment.id),
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: 1,
  });
  return { url: attachment.previewUrl ?? query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}
