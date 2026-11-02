import type { AiTable, AssistantBlock } from "../types/ai-chat.types";

/** Tabla como texto separado por tabulaciones: se pega bien en Excel o Sheets. */
export function tableToTsv(table: AiTable): string {
  const header = table.columnas.map((column) => column.titulo).join("\t");
  const rows = table.filas.map((row) => row.map((cell) => (cell === null ? "" : String(cell))).join("\t"));
  return [table.titulo, header, ...rows].join("\n");
}

/** Respuesta completa para copiar: texto y tablas (las gráficas, por su título). */
export function blocksToPlainText(blocks: AssistantBlock[]): string {
  return blocks
    .map((block) => {
      if (block.kind === "text") return block.text.replace(/\*\*(.+?)\*\*/g, "$1");
      if (block.kind === "table") return tableToTsv(block.table);
      if (block.kind === "chart") return `[Gráfica: ${block.chart.titulo}]`;
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}
