import type { AiFile, AiFileFormat, AiTable } from "../types/ai-chat.types";
import { exportBlocksToPdf, exportTablesToExcel, slug } from "./answer-export";
import { formatValue } from "../components/value-format";

// Arma y descarga en el navegador el archivo que generó Xoco IA
// (generar_archivo): Excel y PDF con las mismas utilidades del panel; CSV,
// TXT, Markdown y JSON como texto plano.

export const FILE_EXTENSION: Record<AiFileFormat, string> = {
  excel: "xlsx",
  pdf: "pdf",
  csv: "csv",
  txt: "txt",
  md: "md",
  json: "json",
};

export const FILE_LABEL: Record<AiFileFormat, string> = {
  excel: "Excel",
  pdf: "PDF",
  csv: "CSV",
  txt: "Texto",
  md: "Markdown",
  json: "JSON",
};

const MIME: Record<Exclude<AiFileFormat, "excel" | "pdf">, string> = {
  csv: "text/csv;charset=utf-8",
  txt: "text/plain;charset=utf-8",
  md: "text/markdown;charset=utf-8",
  json: "application/json;charset=utf-8",
};

function downloadText(content: string, filename: string, mime: string) {
  // BOM en CSV para que Excel lea bien tildes y ñ.
  const blob = new Blob([mime.startsWith("text/csv") ? "﻿" : "", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function tableToCsv(table: AiTable): string {
  return [table.columnas.map((column) => csvCell(column.titulo)), ...table.filas.map((row) => row.map(csvCell))].map((row) => row.join(",")).join("\r\n");
}

function tableToPlain(table: AiTable): string {
  const rows = [table.columnas.map((column) => column.titulo), ...table.filas.map((row) => row.map((cell, index) => formatValue(cell, table.columnas[index]?.formato)))];
  const widths = table.columnas.map((_, index) => Math.max(...rows.map((row) => (row[index] ?? "").length)));
  const line = (row: string[]) => row.map((cell, index) => cell.padEnd(widths[index])).join("  ").trimEnd();
  return [table.titulo, line(rows[0]), widths.map((width) => "-".repeat(width)).join("  "), ...rows.slice(1).map(line), table.nota ?? ""].filter(Boolean).join("\n");
}

function tableToMarkdown(table: AiTable): string {
  const escape = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const header = `| ${table.columnas.map((column) => escape(column.titulo)).join(" | ")} |`;
  const align = `| ${table.columnas.map((column) => (column.formato && column.formato !== "texto" ? "---:" : "---")).join(" | ")} |`;
  const body = table.filas.map((row) => `| ${row.map((cell, index) => escape(formatValue(cell, table.columnas[index]?.formato))).join(" | ")} |`);
  return [`### ${table.titulo}`, "", header, align, ...body, ...(table.nota ? ["", `_${table.nota}_`] : [])].join("\n");
}

function tableToObjects(table: AiTable): Record<string, string | number | null>[] {
  return table.filas.map((row) => Object.fromEntries(table.columnas.map((column, index) => [column.titulo, row[index] ?? null])));
}

function jsonContent(file: AiFile): string {
  if (file.contenido?.trim()) {
    try {
      return JSON.stringify(JSON.parse(file.contenido), null, 2);
    } catch {
      // No es JSON válido: se arma con las tablas (o se guarda el texto como valor).
    }
  }
  const tables = file.tablas ?? [];
  if (tables.length === 1) return JSON.stringify(tableToObjects(tables[0]), null, 2);
  if (tables.length > 1) return JSON.stringify(Object.fromEntries(tables.map((table) => [table.titulo, tableToObjects(table)])), null, 2);
  return JSON.stringify({ contenido: file.contenido ?? "" }, null, 2);
}

function textContent(file: AiFile, markdown: boolean): string {
  const parts: string[] = [];
  if (file.titulo) parts.push(markdown ? `# ${file.titulo}` : file.titulo.toUpperCase());
  if (file.contenido?.trim()) parts.push(markdown ? file.contenido.trim() : file.contenido.replace(/\*\*(.+?)\*\*/g, "$1").trim());
  for (const table of file.tablas ?? []) parts.push(markdown ? tableToMarkdown(table) : tableToPlain(table));
  return `${parts.join("\n\n")}\n`;
}

export function fileName(file: AiFile): string {
  return `${slug(file.nombre)}.${FILE_EXTENSION[file.formato]}`;
}

export async function downloadAiFile(file: AiFile): Promise<void> {
  const base = slug(file.nombre);
  const tables = file.tablas ?? [];
  switch (file.formato) {
    case "excel": {
      if (tables.length) return exportTablesToExcel(tables, file.nombre, true);
      // Solo texto: una columna, una línea por fila.
      const lines = (file.contenido ?? "").split(/\r?\n/);
      return exportTablesToExcel([{ titulo: file.titulo ?? "Hoja 1", columnas: [{ titulo: file.titulo ?? "Contenido", formato: "texto" }], filas: lines.map((line) => [line]) }], file.nombre, true);
    }
    case "pdf":
      return exportBlocksToPdf([{ kind: "file", file }], file.titulo ?? file.nombre, base);
    case "csv": {
      const content = tables.length ? tables.map(tableToCsv).join("\r\n\r\n") : (file.contenido ?? "");
      return downloadText(content, `${base}.csv`, MIME.csv);
    }
    case "json":
      return downloadText(jsonContent(file), `${base}.json`, MIME.json);
    case "md":
      return downloadText(textContent(file, true), `${base}.md`, MIME.md);
    case "txt":
      return downloadText(textContent(file, false), `${base}.txt`, MIME.txt);
  }
}
