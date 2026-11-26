"use client";

import { useState } from "react";
import { Braces, Download, FileSpreadsheet, FileText, FileType, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiFile, AiFileFormat } from "../types/ai-chat.types";
import { FILE_LABEL, downloadAiFile, fileName } from "../lib/ai-file";

const ICON: Record<AiFileFormat, LucideIcon> = {
  excel: FileSpreadsheet,
  csv: FileSpreadsheet,
  pdf: FileType,
  txt: FileText,
  md: FileText,
  json: Braces,
};

function summary(file: AiFile): string {
  const tables = file.tablas ?? [];
  if (!tables.length) return FILE_LABEL[file.formato];
  const rows = tables.reduce((sum, table) => sum + table.filas.length, 0);
  const sheets = file.formato === "excel" ? `${tables.length} ${tables.length === 1 ? "hoja" : "hojas"}` : `${tables.length} ${tables.length === 1 ? "tabla" : "tablas"}`;
  return `${FILE_LABEL[file.formato]} · ${sheets} · ${rows.toLocaleString("es-SV")} ${rows === 1 ? "fila" : "filas"}`;
}

/** Archivo que generó Xoco IA, listo para descargar. */
export function ChatFile({ file }: { file: AiFile }) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const Icon = ICON[file.formato];
  const name = fileName(file);

  async function handleDownload() {
    setLoading(true);
    setFailed(false);
    try {
      await downloadAiFile(file);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground" title={name}>
          {name}
        </p>
        <p className={failed ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{failed ? "No se pudo generar el archivo. Intenta de nuevo." : summary(file)}</p>
      </div>
      <Button type="button" size="sm" onClick={handleDownload} disabled={loading} aria-label={`Descargar ${name}`}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
        Descargar
      </Button>
    </div>
  );
}
