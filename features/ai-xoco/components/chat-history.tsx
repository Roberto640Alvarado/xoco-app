"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, MessageSquare, Pencil, Search, SquarePen, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api/client";
import { takeFreshTitle, useConversations, useDeleteConversation, useRenameConversation } from "../hooks/use-xoco-chat";
import type { AiConversationSummary } from "../types/ai-chat.types";

const STORE_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" });

function groupLabel(updatedAt: string): string {
  const today = STORE_DATE.format(new Date());
  const day = STORE_DATE.format(new Date(updatedAt));
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000);
  if (diff <= 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff <= 7) return "Últimos 7 días";
  if (diff <= 30) return "Últimos 30 días";
  return "Anteriores";
}

function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Título que se escribe letra por letra (como ChatGPT) cuando la IA lo acaba de poner. */
function AnimatedTitle({ id, title }: { id: string; title: string }) {
  const [animate] = useState(() => takeFreshTitle(id));
  const [shown, setShown] = useState(animate ? 0 : title.length);

  useEffect(() => {
    if (!animate) return;
    const timer = setInterval(() => {
      setShown((current) => {
        if (current >= title.length) {
          clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 35);
    return () => clearInterval(timer);
  }, [animate, title]);

  return <>{title.slice(0, shown)}</>;
}

function ConversationRow({
  item,
  active,
  onSelect,
  onDelete,
}: {
  item: AiConversationSummary;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const rename = useRenameConversation();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function save() {
    const next = title.trim();
    if (!next || next === item.title) {
      setEditing(false);
      setTitle(item.title);
      return;
    }
    rename.mutate({ id: item.id, title: next }, { onSettled: () => setEditing(false) });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-lg bg-background px-1.5 py-1 ring-1 ring-border">
        <input
          ref={inputRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") {
              setEditing(false);
              setTitle(item.title);
            }
          }}
          maxLength={120}
          aria-label="Nombre del chat"
          className="min-w-0 flex-1 bg-transparent px-1 text-[13px] text-foreground outline-none"
        />
        <button type="button" onClick={save} aria-label="Guardar nombre" className="rounded p-1 text-muted-foreground hover:text-foreground">
          {rename.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setTitle(item.title);
          }}
          aria-label="Cancelar"
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/row flex items-center rounded-lg transition-colors",
        active ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "page" : undefined}
        className={cn("min-w-0 flex-1 truncate px-2 py-1.5 text-left text-[13px]", active ? "font-medium text-foreground" : "text-foreground/80")}
        title={item.title}
      >
        <AnimatedTitle key={item.title} id={item.id} title={item.title} />
      </button>
      <div className={cn("flex shrink-0 items-center pr-1 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100", active && "opacity-100")}>
        <button type="button" onClick={() => setEditing(true)} aria-label={`Cambiar nombre de ${item.title}`} className="rounded p-1 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete} aria-label={`Eliminar ${item.title}`} className="rounded p-1 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface ChatHistoryProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleted: (id: string) => void;
}

/** Lista de chats del usuario (solo los suyos): buscar, abrir, renombrar y eliminar. */
export function ChatHistory({ activeId, onSelect, onNew, onDeleted }: ChatHistoryProps) {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search.trim());
  const { data, isLoading, isFetching } = useConversations(debounced);
  const remove = useDeleteConversation();
  const [deleting, setDeleting] = useState<AiConversationSummary | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, AiConversationSummary[]>();
    for (const item of data ?? []) {
      const label = groupLabel(item.updatedAt);
      map.set(label, [...(map.get(label) ?? []), item]);
    }
    return [...map.entries()];
  }, [data]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-foreground/85 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      >
        <SquarePen className="h-4 w-4" aria-hidden="true" />
        Nuevo chat
      </button>

      <label className="relative flex items-center">
        <span className="sr-only">Buscar chats</span>
        <Search className="pointer-events-none absolute left-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar chats"
          className="h-8 w-full rounded-lg border border-transparent bg-black/5 pl-8 pr-7 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-border focus:bg-background dark:bg-white/5"
        />
        {isFetching && debounced && <Loader2 className="absolute right-2 h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden="true" />}
      </label>

      <nav aria-label="Tus chats" className="-mx-1 mt-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 [scrollbar-width:thin]">
        {isLoading ? (
          [0, 1, 2, 3].map((index) => <div key={index} className="h-7 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />)
        ) : groups.length === 0 ? (
          <p className="flex flex-col items-center gap-1.5 px-2 py-6 text-center text-xs text-muted-foreground">
            <MessageSquare className="h-5 w-5 opacity-50" aria-hidden="true" />
            {debounced ? "Ningún chat coincide con la búsqueda." : "Tus chats aparecerán aquí."}
          </p>
        ) : (
          groups.map(([label, items]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <p className="px-2 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              {items.map((item) => (
                <ConversationRow key={item.id} item={item} active={item.id === activeId} onSelect={() => onSelect(item.id)} onDelete={() => setDeleting(item)} />
              ))}
            </div>
          ))
        )}
      </nav>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="¿Eliminar este chat?"
        description={`Se borrará "${deleting?.title ?? ""}" con todos sus mensajes. No se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={remove.isPending}
        errorMessage={(remove.error as ApiError | null)?.message ?? null}
        onConfirm={() => {
          if (!deleting) return;
          const id = deleting.id;
          remove.mutate(id, {
            onSuccess: () => {
              setDeleting(null);
              onDeleted(id);
            },
          });
        }}
      />
    </div>
  );
}
