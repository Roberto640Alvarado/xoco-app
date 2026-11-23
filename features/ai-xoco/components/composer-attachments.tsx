"use client";

import { Loader2, X } from "lucide-react";
import { formatBytes } from "../lib/attachments";
import type { PendingAttachment } from "../types/ai-chat.types";
import { AttachmentIcon, attachmentLabel } from "./attachment-icon";

interface ComposerAttachmentsProps {
  attachments: PendingAttachment[];
  preparing: number;
  disabled?: boolean;
  onRemove: (localId: string) => void;
}

/** Archivos listos para enviar, encima del cuadro de texto (como en ChatGPT). */
export function ComposerAttachments({ attachments, preparing, disabled, onRemove }: ComposerAttachmentsProps) {
  if (attachments.length === 0 && preparing === 0) return null;

  return (
    <ul className="flex gap-2 overflow-x-auto px-1 pb-1 pt-1" aria-label="Archivos adjuntos">
      {attachments.map((attachment) => (
        <li key={attachment.localId} className="group/chip relative shrink-0">
          {attachment.kind === "image" && attachment.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa local (object URL)
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              title={attachment.note ? `${attachment.name} · ${attachment.note}` : attachment.name}
              className="h-14 w-14 rounded-xl border border-border object-cover"
            />
          ) : (
            <div
              className="flex h-14 w-52 items-center gap-2 rounded-xl border border-border bg-muted/40 px-2.5"
              title={attachment.note ? `${attachment.name} · ${attachment.note}` : attachment.name}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7b4a30] text-white dark:bg-[#d0996c] dark:text-[#2a1a10]">
                <AttachmentIcon kind={attachment.kind} mimeType={attachment.mimeType} className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-foreground">{attachment.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {attachment.note ?? attachmentLabel(attachment.kind, attachment.mimeType)} · {formatBytes(attachment.size)}
                </span>
              </span>
            </div>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(attachment.localId)}
            aria-label={`Quitar ${attachment.name}`}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted disabled:opacity-0 sm:opacity-0 sm:group-hover/chip:opacity-100 sm:focus-visible:opacity-100"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </li>
      ))}
      {Array.from({ length: preparing }, (_, index) => (
        <li key={`preparing-${index}`} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-border" aria-label="Preparando archivo">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}
