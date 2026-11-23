"use client";

import { Loader2 } from "lucide-react";
import { fetchAttachmentBlob } from "../api/ai-chat.api";
import { useAttachmentUrl } from "../hooks/use-attachment-url";
import { formatBytes } from "../lib/attachments";
import type { ChatAttachment } from "../types/ai-chat.types";
import { AttachmentIcon, attachmentLabel } from "./attachment-icon";

interface MessageAttachmentsProps {
  conversationId: string | null;
  attachments: ChatAttachment[];
}

/** Abre el archivo en otra pestaña (los guardados se piden con el token). */
async function openAttachment(conversationId: string | null, attachment: ChatAttachment, knownUrl: string | null) {
  if (knownUrl) {
    window.open(knownUrl, "_blank", "noopener");
    return;
  }
  if (!conversationId || !attachment.id) return;
  // La pestaña se abre antes del fetch para que el navegador no la bloquee.
  const tab = window.open("", "_blank");
  try {
    const url = URL.createObjectURL(await fetchAttachmentBlob(conversationId, attachment.id));
    if (tab) tab.location.href = url;
  } catch {
    tab?.close();
  }
}

function ImageAttachment({ conversationId, attachment }: { conversationId: string | null; attachment: ChatAttachment }) {
  const { url, isLoading } = useAttachmentUrl(conversationId, attachment);
  return (
    <button
      type="button"
      onClick={() => void openAttachment(conversationId, attachment, url)}
      className="block overflow-hidden rounded-2xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Ver ${attachment.name}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagen del chat (object URL)
        <img src={url} alt={attachment.name} className="max-h-60 w-auto max-w-full object-contain sm:max-h-72" />
      ) : (
        <span className="flex h-32 w-40 items-center justify-center text-muted-foreground">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <AttachmentIcon kind="image" mimeType={attachment.mimeType} className="h-6 w-6" aria-hidden="true" />}
        </span>
      )}
    </button>
  );
}

function FileAttachment({ conversationId, attachment }: { conversationId: string | null; attachment: ChatAttachment }) {
  const canOpen = Boolean(attachment.id && conversationId);
  return (
    <button
      type="button"
      disabled={!canOpen}
      onClick={() => void openAttachment(conversationId, attachment, null)}
      title={canOpen ? `Abrir ${attachment.name}` : attachment.name}
      className="flex w-60 max-w-full items-center gap-2.5 rounded-2xl border border-border bg-background px-3 py-2 text-left transition-colors enabled:hover:bg-muted/50 disabled:cursor-default"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7b4a30] text-white dark:bg-[#d0996c] dark:text-[#2a1a10]">
        <AttachmentIcon kind={attachment.kind} mimeType={attachment.mimeType} className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-foreground">{attachment.name}</span>
        <span className="block text-[11px] text-muted-foreground">
          {attachmentLabel(attachment.kind, attachment.mimeType)} · {formatBytes(attachment.size)}
        </span>
      </span>
    </button>
  );
}

/** Archivos de una pregunta: imágenes en miniatura y el resto como tarjetas (clic para abrir). */
export function MessageAttachments({ conversationId, attachments }: MessageAttachmentsProps) {
  if (attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {attachments.map((attachment) =>
        attachment.kind === "image" ? (
          <ImageAttachment key={attachment.key} conversationId={conversationId} attachment={attachment} />
        ) : (
          <FileAttachment key={attachment.key} conversationId={conversationId} attachment={attachment} />
        ),
      )}
    </div>
  );
}
