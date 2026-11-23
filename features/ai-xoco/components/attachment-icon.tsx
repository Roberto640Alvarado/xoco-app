import { FileImage, FileSpreadsheet, FileText, type LucideProps } from "lucide-react";
import type { AiAttachmentKind } from "../types/ai-chat.types";

/** Icono según el tipo de archivo (los CSV/Excel como hoja de cálculo). */
export function AttachmentIcon({ kind, mimeType, ...props }: { kind: AiAttachmentKind; mimeType: string } & LucideProps) {
  if (kind === "image") return <FileImage {...props} />;
  if (mimeType === "text/csv" || mimeType === "text/tab-separated-values") return <FileSpreadsheet {...props} />;
  return <FileText {...props} />;
}

export function attachmentLabel(kind: AiAttachmentKind, mimeType: string): string {
  if (kind === "image") return "Imagen";
  if (kind === "pdf") return "PDF";
  if (mimeType === "text/csv" || mimeType === "text/tab-separated-values") return "Hoja de datos";
  if (mimeType === "application/json") return "JSON";
  return "Texto";
}
