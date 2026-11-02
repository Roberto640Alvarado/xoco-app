"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { AlertTriangle, ArrowUp, Loader2, PanelLeft, Square, SquarePen } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { XocoAgent } from "./xoco-agent";
import { AssistantMessage, UserBubble } from "./chat-message";
import { ChatHistory } from "./chat-history";
import { ProviderIcon } from "./provider-icon";
import { CHAT_SUGGESTIONS } from "../lib/connector-content";
import { useAiChatConfig, useXocoChat } from "../hooks/use-xoco-chat";
import type { AiProviderKey } from "../types/ai-chat.types";

const SUGGESTION_PROMPTS: Record<string, string> = {
  "Resumen del mes": "Dame el resumen de este mes: venta oficial por tienda y cómo vamos contra la meta. Con gráfica.",
  "Lo más vendido": "¿Cuáles fueron los 10 productos más vendidos la semana pasada en cada tienda? En tabla.",
  "¿Qué me falta?": "¿Qué productos tienen poca existencia estimada hoy en Centrika?",
  "Kardex rápido": "Dame el kardex de este mes de las cajas de bombones de 6 en Centrika.",
};

// Xoco IA → Chat: chat estilo ChatGPT con Claude u OpenAI sobre los datos del
// panel y de Odoo (solo lectura). Las respuestas pueden traer gráficas y tablas.
export function XocoChatView() {
  const firstName = useAuthStore((state) => state.user?.name?.split(" ")[0]);
  const { data: config, isLoading: configLoading } = useAiChatConfig();
  const [conversationId, setConversationId] = useQueryState("c", parseAsString);
  const [historyOpen, setHistoryOpen] = useState(false);
  const onConversation = useCallback((id: string) => void setConversationId(id), [setConversationId]);
  const { entries, isStreaming, isLoading: chatLoading, loadError, send, stop } = useXocoChat(conversationId, onConversation);
  const [draft, setDraft] = useState("");
  const [chosen, setChosen] = useState<AiProviderKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const providers = config?.providers ?? [];
  const available = providers.filter((provider) => provider.available);
  const provider = providers.find((item) => item.key === chosen && item.available) ?? available[0];
  const noProviders = !configLoading && available.length === 0;

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [entries]);

  function submit(text: string) {
    if (!provider || !text.trim() || isStreaming) return;
    void send(text, provider.key, provider.label);
    setDraft("");
    inputRef.current?.focus();
  }

  function newChat() {
    if (isStreaming) stop();
    void setConversationId(null);
    setDraft("");
    setHistoryOpen(false);
    inputRef.current?.focus();
  }

  function openChat(id: string) {
    if (isStreaming && id !== conversationId) stop();
    void setConversationId(id);
    setHistoryOpen(false);
  }

  function onDeleted(id: string) {
    if (id === conversationId) newChat();
  }

  const history = <ChatHistory activeId={conversationId} onSelect={openChat} onNew={newChat} onDeleted={onDeleted} />;

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-[520px] overflow-hidden rounded-2xl border border-border bg-background shadow-sm sm:h-[calc(100dvh-7.5rem)]">
      {/* Barra lateral */}
      <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r border-border bg-muted/40 p-3 md:flex" aria-label="Chats">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <XocoAgent size={30} sparkles={false} />
            Xoco IA
          </span>
          <PanelLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        {history}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground md:hidden dark:hover:bg-white/5"
              aria-label="Ver mis chats"
            >
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="truncate text-base font-semibold text-foreground">Xoco IA</span>
            <button
              type="button"
              onClick={newChat}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground md:hidden dark:hover:bg-white/5"
              aria-label="Nuevo chat"
            >
              <SquarePen className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Selector de IA */}
          <div role="radiogroup" aria-label="Inteligencia artificial" className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
            {(providers.length ? providers : [
              { key: "claude" as const, label: "Claude", model: "", available: false },
              { key: "openai" as const, label: "ChatGPT", model: "", available: false },
            ]).map((item) => {
              const active = provider?.key === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!item.available || isStreaming}
                  onClick={() => setChosen(item.key)}
                  title={item.available ? `${item.label} · ${item.model}` : `${item.label}: falta su llave (Xoco IA → Llaves de API)`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed",
                    active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    !item.available && "opacity-40",
                  )}
                >
                  <ProviderIcon provider={item.key} className={cn("size-3.5", active && item.key === "claude" && "text-[#c15f3c] dark:text-[#e8a38a]")} />
                  <span className="max-[380px]:sr-only">{item.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 sm:px-4">
          <div className={cn("mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 py-5", entries.length === 0 && "justify-center")}>
            {chatLoading ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Abriendo chat…
              </div>
            ) : loadError ? (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {loadError}
              </p>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <XocoAgent size={112} />
                <h1 className="text-xl font-semibold text-foreground sm:text-3xl">
                  {firstName ? `Hola, ${firstName}. ` : ""}¿En qué te ayudo hoy?
                </h1>
                <p className="max-w-md text-sm text-muted-foreground">
                  {noProviders
                    ? "Xoco IA todavía no tiene llaves de Claude ni de OpenAI. Agrégalas en Xoco IA → Llaves de API para empezar."
                    : "Pregúntame por ventas, metas, inventario o cualquier dato de Odoo. Te respondo con cifras del panel, gráficas y tablas."}
                </p>
              </div>
            ) : (
              entries.map((entry) => (entry.role === "user" ? <UserBubble key={entry.id} text={entry.text} /> : <AssistantMessage key={entry.id} entry={entry} />))
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl px-3 pb-3 sm:px-4 sm:pb-4">
          {entries.length === 0 && !conversationId && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {CHAT_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={suggestion.title}
                  type="button"
                  disabled={!provider}
                  onClick={() => submit(SUGGESTION_PROMPTS[suggestion.title] ?? suggestion.detail)}
                  className={cn(
                    "flex items-start gap-2.5 rounded-2xl border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50",
                    index > 1 && "hidden sm:flex",
                  )}
                >
                  <suggestion.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#7b4a30] dark:text-[#d0996c]" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{suggestion.title}</span>
                    <span className="hidden truncate text-xs text-muted-foreground sm:block">{suggestion.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(draft);
            }}
            className="rounded-3xl border border-border bg-card p-2 shadow-sm focus-within:border-foreground/20"
          >
            <label htmlFor="xoco-chat-input" className="sr-only">
              Mensaje para Xoco IA
            </label>
            <textarea
              ref={inputRef}
              id="xoco-chat-input"
              rows={1}
              value={draft}
              disabled={!provider}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submit(draft);
                }
              }}
              placeholder={provider ? "Pregúntale a Xoco…" : configLoading ? "Cargando…" : "Agrega una llave en Xoco IA → Llaves de API"}
              className="block max-h-40 min-h-[2.5rem] w-full resize-none bg-transparent px-3 py-2 text-sm text-foreground [field-sizing:content] placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="flex min-w-0 items-center gap-1.5 truncate pl-2 text-[11px] text-muted-foreground">
                {provider && <ProviderIcon provider={provider.key} className="size-3" />}
                <span className="truncate">{provider ? `${provider.label} · ${provider.model}` : ""}</span>
              </span>
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Detener respuesta"
                  title="Detener"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
                >
                  <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!provider || !draft.trim()}
                  aria-label="Enviar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Xoco IA puede equivocarse. Revisa las cifras importantes en el panel.</p>
        </div>
      </section>

      {/* Celular: los chats en un panel lateral */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="flex w-[85vw] max-w-xs flex-col gap-2 p-3">
          <SheetTitle className="flex items-center gap-2 px-1 pt-1 text-sm font-semibold">
            <XocoAgent size={28} sparkles={false} />
            Xoco IA
          </SheetTitle>
          {history}
        </SheetContent>
      </Sheet>
    </div>
  );
}
