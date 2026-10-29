import { formatDateTime } from "@/lib/format";
import { formatLineQuantity, groupByCategory } from "./group-by-category";
import { STATUS_LABEL } from "./request-status";
import type { StockRequest } from "../types/stock-request.types";
import { replacedName, substitutesOf } from "./substitution";

const BROWN: [number, number, number] = [74, 44, 29];
const CREAM: [number, number, number] = [245, 237, 228];
const RED: [number, number, number] = [185, 28, 28];

function qty(value: number | null, unit: "unidad" | "kg"): string {
  return value === null ? "" : formatLineQuantity(value, unit);
}

function diff(value: number | null, unit: "unidad" | "kg"): string {
  if (value === null) return "";
  if (value === 0) return "0";
  const text = formatLineQuantity(Math.abs(value), unit);
  return `${value > 0 ? "+" : "-"}${text}`;
}

function fileName(request: StockRequest): string {
  const store = request.storeName.normalize("NFD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${request.code}-${store || "tienda"}.pdf`;
}

/**
 * Genera el "Formato envío a sucursales" de una solicitud en PDF: por
 * categoría, con lo pedido, enviado, recibido y la diferencia, más las
 * firmas de planta y tienda. Se carga jsPDF bajo demanda para no inflar el
 * bundle de la pantalla.
 */
export async function downloadRequestPdf(request: StockRequest): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Encabezado
  doc.setFillColor(...BROWN);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("XOCOLATÍSIMO", margin, 34);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("FORMATO ENVÍO A SUCURSALES", margin, 54);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`N.º de requisición: ${request.code}`, pageWidth - margin, 34, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(STATUS_LABEL[request.status], pageWidth - margin, 54, { align: "right" });

  // Datos generales
  doc.setTextColor(30, 30, 30);
  const info: [string, string][] = [
    ["Sucursal", request.storeName],
    ["Solicitada", `${formatDateTime(request.createdAt)} · ${request.createdByEmail}`],
    ["Despachada", request.dispatchedAt ? formatDateTime(request.dispatchedAt) : "—"],
    ["Recibida", request.receivedAt ? formatDateTime(request.receivedAt) : "—"],
  ];
  let y = 92;
  doc.setFontSize(10);
  for (const [label, value] of info) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 72, y);
    y += 16;
  }
  if (request.note) {
    doc.setFont("helvetica", "bold");
    doc.text("Nota tienda:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(request.note, pageWidth - margin * 2 - 72), margin + 72, y);
    y += 16;
  }

  // Tabla por categoría
  type Cell = string | { content: string; colSpan: number; styles: Record<string, unknown> };
  const body: Cell[][] = [];
  const groups = groupByCategory(request.lines);
  for (const group of groups) {
    body.push([
      { content: group.category.toUpperCase(), colSpan: 6, styles: { fillColor: CREAM, fontStyle: "bold", textColor: BROWN } },
    ]);
    for (const line of group.items) {
      const replaces = replacedName(line, request.lines);
      const subs = substitutesOf(line.productId, request.lines);
      const observation = [
        line.addedByPlant ? (replaces ? `En lugar de ${replaces}` : "Agregado por planta") : null,
        subs.length > 0 ? `Va ${subs.map((sub) => sub.productName).join(" y ")} en su lugar` : null,
        line.plantNote,
        line.storeNote,
      ]
        .filter(Boolean)
        .join(" · ");
      body.push([
        line.productName,
        qty(line.addedByPlant ? null : line.requestedQuantity, line.unit),
        qty(line.sentQuantity, line.unit),
        qty(line.receivedQuantity, line.unit),
        diff(line.difference, line.unit),
        observation,
      ]);
    }
  }

  autoTable(doc, {
    startY: y + 6,
    margin: { left: margin, right: margin, bottom: 110 },
    head: [["Producto", "Pedido", "Enviado", "Recibido", "DIF", "Observaciones"]],
    body: body as never,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4, lineColor: [210, 200, 190], lineWidth: 0.5, textColor: [30, 30, 30] },
    headStyles: { fillColor: BROWN, textColor: 255, halign: "center" },
    columnStyles: {
      0: { cellWidth: 170 },
      1: { halign: "center", cellWidth: 50 },
      2: { halign: "center", cellWidth: 52 },
      3: { halign: "center", cellWidth: 56 },
      4: { halign: "center", cellWidth: 44 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4 && typeof data.cell.raw === "string") {
        const raw = data.cell.raw;
        if (raw && raw !== "0") data.cell.styles.textColor = RED;
      }
    },
  });

  // Firmas (en la última página, al pie)
  const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  let signY = lastY + 28;
  if (request.cancelReason) {
    doc.setTextColor(...RED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Cancelada: ${request.cancelReason}`, margin, lastY + 18);
    doc.setTextColor(30, 30, 30);
    signY = lastY + 40;
  }
  if (signY > pageHeight - 90) {
    doc.addPage();
    signY = 80;
  }
  signY = Math.max(signY, pageHeight - 90);
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.6);
  const colWidth = (pageWidth - margin * 2 - 40) / 2;
  doc.line(margin, signY, margin + colWidth, signY);
  doc.line(margin + colWidth + 40, signY, pageWidth - margin, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Entregó (Planta)", margin + colWidth / 2, signY + 13, { align: "center" });
  doc.text(`Recibió (${request.storeName})`, margin + colWidth + 40 + colWidth / 2, signY + 13, { align: "center" });

  // Pie con paginación
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`${request.code} · Página ${page} de ${pages}`, pageWidth - margin, pageHeight - 20, { align: "right" });
  }

  doc.save(fileName(request));
}
