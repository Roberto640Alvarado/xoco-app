import { exportRowsToExcel, type ExportSheet } from "@/lib/export-xlsx";
import type { AiChart, AiTable, AssistantBlock } from "../types/ai-chat.types";
import { formatValue } from "../components/value-format";

// Descargas de Xoco IA (Excel y PDF) armadas en el navegador con los mismos
// datos que ya se ven en el chat: la IA no genera archivos, el panel sí.

const BROWN: [number, number, number] = [74, 44, 29];
const CREAM: [number, number, number] = [245, 237, 228];
const INK: [number, number, number] = [30, 30, 30];
const MUTED: [number, number, number] = [110, 100, 92];
const WHITE: [number, number, number] = [255, 255, 255];

type Doc = import("jspdf").jsPDF;
type AutoTable = typeof import("jspdf-autotable").default;

/** Gráfica como tabla: una fila por etiqueta y una columna por serie. */
export function chartToTable(chart: AiChart): AiTable {
  return {
    titulo: chart.titulo,
    columnas: [{ titulo: chart.tipo === "pastel" ? "Concepto" : "Etiqueta", formato: "texto" }, ...chart.series.map((serie) => ({ titulo: serie.nombre, formato: chart.formato }))],
    filas: chart.etiquetas.map((etiqueta, index) => [etiqueta, ...chart.series.map((serie) => serie.valores[index] ?? null)]),
    nota: chart.nota,
  };
}

/** Tablas de una respuesta (las gráficas también, como tabla), en orden. */
export function answerTables(blocks: AssistantBlock[]): AiTable[] {
  return blocks.flatMap((block) => {
    if (block.kind === "table") return [block.table];
    if (block.kind === "chart") return [chartToTable(block.chart)];
    if (block.kind === "file") return block.file.tablas ?? [];
    return [];
  });
}

export function slug(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "xoco-ia"
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Encabezados únicos: Excel usa el título como llave de la columna. */
function uniqueHeaders(table: AiTable): string[] {
  const used = new Map<string, number>();
  return table.columnas.map((column) => {
    const base = column.titulo.trim() || "Columna";
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
}

// Los números van crudos (sumables en Excel). Los porcentajes quedan en puntos
// (21.5 = 21.5%), igual que en el chat, y su columna lo aclara con "(%)".
function tableToSheet(table: AiTable): ExportSheet {
  const headers = uniqueHeaders(table);
  return {
    name: table.titulo,
    rows: table.filas.map((row) =>
      Object.fromEntries(headers.map((header, index) => [table.columnas[index]?.formato === "porcentaje" ? `${header} (%)` : header, row[index] ?? ""])),
    ),
  };
}

/** `exactName`: usa el nombre tal cual (archivo que pidió el usuario), sin agregar la fecha. */
export function exportTablesToExcel(tables: AiTable[], filename = tables[0]?.titulo ?? "xoco-ia", exactName = false): void {
  exportRowsToExcel(exactName ? slug(filename) : `${slug(filename)}-${today()}`, tables.map(tableToSheet));
}

async function loadPdf(): Promise<{ doc: Doc; autoTable: AutoTable }> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  return { doc, autoTable: autoTableModule.default };
}

function drawHeader(doc: Doc, title: string, margin: number): number {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BROWN);
  doc.rect(0, 0, width, 56, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("XOCOLATÍSIMO", margin, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("XOCO IA", margin, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const titleLines = doc.splitTextToSize(title, width / 2);
  doc.text(titleLines[0] ?? "", width - margin, 26, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("es-SV", { day: "2-digit", month: "long", year: "numeric" }), width - margin, 42, { align: "right" });
  return 80;
}

/** Salta de página si lo que sigue no cabe. */
function ensureSpace(doc: Doc, y: number, needed: number, margin: number): number {
  if (y + needed <= doc.internal.pageSize.getHeight() - margin) return y;
  doc.addPage();
  return margin;
}

function drawText(doc: Doc, text: string, y: number, margin: number): number {
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const clean = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "");
  for (const paragraph of clean.split(/\n{2,}/)) {
    const lines: string[] = doc.splitTextToSize(paragraph.trim(), width);
    for (const line of lines) {
      y = ensureSpace(doc, y, 14, margin);
      doc.text(line, margin, y);
      y += 14;
    }
    y += 6;
  }
  return y;
}

function drawTable(doc: Doc, autoTable: AutoTable, table: AiTable, y: number, margin: number): number {
  y = ensureSpace(doc, y, 60, margin);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(table.titulo, margin, y);
  const numericColumns = table.columnas.map((column) => Boolean(column.formato && column.formato !== "texto"));
  autoTable(doc, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [table.columnas.map((column) => column.titulo)],
    body: table.filas.map((row) => table.columnas.map((column, index) => formatValue(row[index] ?? null, column.formato))),
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, textColor: INK, overflow: "linebreak" },
    headStyles: { fillColor: BROWN, textColor: WHITE, fontStyle: "bold" },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: Object.fromEntries(numericColumns.map((numeric, index) => [index, { halign: numeric ? ("right" as const) : ("left" as const) }])),
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  if (table.nota) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const lines: string[] = doc.splitTextToSize(table.nota, doc.internal.pageSize.getWidth() - margin * 2);
    for (const line of lines) {
      y = ensureSpace(doc, y + 10, 10, margin);
      doc.text(line, margin, y);
    }
  }
  return y + 22;
}

function drawFooters(doc: Doc, margin: number) {
  const pages = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Generado con Xoco IA — los datos salen del panel y de Odoo.", margin, height - 20);
    doc.text(`Página ${page} de ${pages}`, width - margin, height - 20, { align: "right" });
  }
}

/** PDF de una respuesta completa (texto + tablas + gráficas como tabla) o de una sola tabla. */
export async function exportBlocksToPdf(blocks: AssistantBlock[], title: string, filename = `${slug(title)}-${today()}`): Promise<void> {
  const { doc, autoTable } = await loadPdf();
  const margin = 40;
  let y = drawHeader(doc, title, margin);
  for (const block of blocks) {
    if (block.kind === "text") y = drawText(doc, block.text, y, margin);
    else if (block.kind === "table") y = drawTable(doc, autoTable, block.table, y, margin);
    else if (block.kind === "chart") y = drawTable(doc, autoTable, chartToTable(block.chart), y, margin);
    else if (block.kind === "file") {
      if (block.file.contenido && block.file.formato !== "json") y = drawText(doc, block.file.contenido, y, margin);
      for (const table of block.file.tablas ?? []) y = drawTable(doc, autoTable, table, y, margin);
    }
  }
  drawFooters(doc, margin);
  doc.save(`${filename}.pdf`);
}

export function exportTableToPdf(table: AiTable): Promise<void> {
  return exportBlocksToPdf([{ kind: "table", table }], table.titulo);
}

/** Título del archivo de una respuesta: el de su primera tabla o gráfica. */
export function answerTitle(blocks: AssistantBlock[]): string {
  return answerTables(blocks)[0]?.titulo ?? "Respuesta de Xoco IA";
}
