"use client";

import { useCallback, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteConversation, fetchAiChatConfig, fetchConversation, fetchConversations, renameConversation, streamAiChat } from "../api/ai-chat.api";
import type { AiChatEvent, AiConversationDetail, AiProviderKey, AssistantBlock, ChatEntry } from "../types/ai-chat.types";

const CONVERSATIONS = ["ai-chat", "conversations"] as const;

// Chats cuyo título acaba de poner la IA: la barra lateral lo escribe con animación una vez.
const freshTitles = new Set<string>();
export function takeFreshTitle(id: string): boolean {
  return freshTitles.delete(id);
}

export function useAiChatConfig() {
  return useQuery({ queryKey: ["ai-chat", "config"], queryFn: fetchAiChatConfig, staleTime: 5 * 60_000 });
}

export function useConversations(search: string) {
  return useQuery({
    queryKey: [...CONVERSATIONS, search],
    queryFn: () => fetchConversations(search || undefined),
    placeholderData: keepPreviousData,
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameConversation(id, title),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CONVERSATIONS }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CONVERSATIONS }),
  });
}

let counter = 0;
const newId = () => `m${Date.now()}-${(counter += 1)}`;

function applyEvent(blocks: AssistantBlock[], event: AiChatEvent): AssistantBlock[] {
  switch (event.type) {
    case "tool":
      return [...blocks, { kind: "tool", title: event.title }];
    case "text":
      return [...blocks, { kind: "text", text: event.text, fresh: true }];
    case "chart":
      return [...blocks, { kind: "chart", chart: event.chart }];
    case "table":
      return [...blocks, { kind: "table", table: event.table }];
    case "error":
      return [...blocks, { kind: "error", message: event.message }];
    default:
      return blocks;
  }
}

const PROVIDER_LABEL: Record<AiProviderKey, string> = { claude: "Claude", openai: "ChatGPT" };

function toEntries(detail: AiConversationDetail): ChatEntry[] {
  return detail.messages.map((message) =>
    message.role === "user"
      ? { id: message.id, role: "user", text: message.text }
      : {
          id: message.id,
          role: "assistant",
          provider: message.provider ?? detail.provider,
          label: PROVIDER_LABEL[message.provider ?? detail.provider],
          model: message.model ?? undefined,
          blocks: message.blocks ?? (message.text ? [{ kind: "text", text: message.text }] : []),
          status: message.status ?? "done",
        },
  );
}

type AssistantEntry = Extract<ChatEntry, { role: "assistant" }>;

/**
 * Un chat de Xoco IA. `conversationId` viene de la URL (?c=…): si no es el
 * chat que ya está en pantalla, se carga del servidor. Un chat nuevo recibe
 * su id en el evento "conversation" y avisa con `onConversation` para ponerlo
 * en la URL sin volver a cargarlo.
 *
 * (Sin efectos para cargar: el modo estricto de React corre los efectos dos
 * veces y la versión anterior se quedaba en "Abriendo chat…".)
 */
export function useXocoChat(conversationId: string | null, onConversation: (id: string) => void) {
  const queryClient = useQueryClient();
  // Chat en pantalla: su id (null = chat nuevo sin guardar) y sus mensajes.
  const [live, setLive] = useState<{ id: string | null; entries: ChatEntry[] }>({ id: null, entries: [] });
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const liveIdRef = useRef<string | null>(null);

  const needsLoad = conversationId !== null && conversationId !== live.id;
  const detail = useQuery({
    queryKey: ["ai-chat", "conversation", conversationId],
    queryFn: () => fetchConversation(conversationId as string),
    enabled: needsLoad,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  // Ajuste de estado durante el render (patrón de React para "derivar" estado).
  if (needsLoad && detail.data && detail.data.id === conversationId && !isStreaming) {
    liveIdRef.current = conversationId;
    setLive({ id: conversationId, entries: toEntries(detail.data) });
  } else if (conversationId === null && live.id !== null && !isStreaming) {
    liveIdRef.current = null;
    setLive({ id: null, entries: [] });
  }

  const updateAssistant = useCallback((id: string, update: (entry: AssistantEntry) => Partial<AssistantEntry>) => {
    setLive((current) => ({
      ...current,
      entries: current.entries.map((entry) => (entry.id === id && entry.role === "assistant" ? { ...entry, ...update(entry) } : entry)),
    }));
  }, []);

  const send = useCallback(
    async (text: string, provider: AiProviderKey, label: string) => {
      const question = text.trim();
      if (!question || isStreaming) return;

      const assistantId = newId();
      setLive((current) => ({
        ...current,
        entries: [
          ...current.entries,
          { id: newId(), role: "user", text: question },
          { id: assistantId, role: "assistant", provider, label, blocks: [], status: "streaming" },
        ],
      }));
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamAiChat({
          provider,
          conversationId: liveIdRef.current ?? undefined,
          message: question,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === "conversation") {
              if (liveIdRef.current !== event.id) {
                liveIdRef.current = event.id;
                setLive((current) => ({ ...current, id: event.id }));
                onConversation(event.id);
              }
              void queryClient.invalidateQueries({ queryKey: CONVERSATIONS });
              return;
            }
            if (event.type === "title") {
              freshTitles.add(event.id);
              void queryClient.invalidateQueries({ queryKey: CONVERSATIONS });
              return;
            }
            if (event.type === "start") {
              updateAssistant(assistantId, () => ({ label: event.label, model: event.model }));
              return;
            }
            updateAssistant(assistantId, (entry) => ({
              blocks: applyEvent(entry.blocks, event),
              ...(event.type === "done" ? { status: "done" as const } : {}),
              ...(event.type === "error" ? { status: "error" as const } : {}),
            }));
          },
        });
        updateAssistant(assistantId, (entry) => (entry.status === "streaming" ? { status: "done" } : {}));
      } catch (error) {
        if (controller.signal.aborted) {
          updateAssistant(assistantId, () => ({ status: "stopped" }));
        } else {
          updateAssistant(assistantId, (entry) => ({
            status: "error",
            blocks: [...entry.blocks, { kind: "error", message: error instanceof Error ? error.message : "No se pudo conectar con Xoco IA." }],
          }));
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        void queryClient.invalidateQueries({ queryKey: CONVERSATIONS });
      }
    },
    [isStreaming, onConversation, queryClient, updateAssistant],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return {
    entries: needsLoad ? [] : live.entries,
    isStreaming,
    isLoading: needsLoad && !detail.isError,
    loadError: needsLoad && detail.isError ? (detail.error instanceof Error ? detail.error.message : "No se pudo abrir el chat.") : null,
    send,
    stop,
  };
}
