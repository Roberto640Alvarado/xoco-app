import { formatDateTime, formatInteger, formatKg } from "@/lib/format";
import type { Kardex, KardexProduct } from "../types/inventory-kardex.types";
import { byCategory, formatKardexQuantity, formatPeriod, formatSigned, slug } from "./kardex-format";

// Paleta del formato impreso (misma que el "Formato envío a sucursales").
const BROWN: [number, number, number] = [74, 44, 29];
const BROWN_SOFT: [number, number, number] = [122, 84, 60];
const CREAM: [number, number, number] = [245, 237, 228];
const CREAM_DARK: [number, number, number] = [232, 219, 204];
const INK: [number, number, number] = [30, 30, 30];
const MUTED: [number, number, number] = [110, 100, 92];
const GREEN: [number, number, number] = [21, 128, 61];
const RED: [number, number, number] = [185, 28, 28];
const BLUE: [number, number, number] = [3, 105, 161];

type Doc = import("jspdf").jsPDF;
type AutoTable = typeof import("jspdf-autotable").default;

function lastY(doc: Doc, fallback: number): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback;
}

// Suma piezas y kg por separado: no se mezclan unidades.
function totalsText(products: KardexProduct[], pick: (product: KardexProduct) => number): { main: string; extra: string | null } {
  const pieces = products.filter((p) => p.unit === "unidad").reduce((sum, p) => sum + pick(p), 0);
  const kilos = products.filter((p) => p.unit === "kg").reduce((sum, p) => sum + pick(p), 0);
  return { main: `${formatInteger(pieces)} u`, extra: kilos ? `+ ${formatKg(kilos)}` : null };
}

function drawHeader(doc: Doc, kardex: Kardex, margin: number) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BROWN);
  doc.rect(0, 0, width, 64, "F");
  doc.setFillColor(...BROWN_SOFT);
  doc.rect(0, 64, width, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("XOCOLATÍSIMO", margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("KARDEX DE INVENTARIO", margin, 48);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(kardex.storeName, width - margin, 30, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(formatPeriod(kardex.dateFrom, kardex.dateTo), width - margin, 48, { align: "right" });
}

function drawStatBox(doc: Doc, x: number, y: number, w: number, label: string, value: string, extra: string | null, color: [number, number, number]) {
  doc.setFillColor(...CREAM);
  doc.setDrawColor(...CREAM_DARK);
  doc.roundedRect(x, y, w, 52, 6, 6, "FD");
  doc.setFillColor(...color);
  doc.rect(x, y + 8, 3, 36, "F");
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(label.toUpperCase(), x + 12, y + 17);
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(value, x + 12, y + 37);
  if (extra) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(extra, x + 12, y + 47);
  }
}

/**
 * Kardex de inventario de una tienda en PDF (carta horizontal): portada con
 * los totales, resumen por producto agrupado por categoría y el detalle de
 * cada producto con su saldo línea por línea, firmas y paginación.
 */
export async function downloadKardexPdf(kardex: Kardex, generatedBy: string | undefined): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable: AutoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  drawHeader(doc, kardex, margin);

  // Datos generales
  doc.setTextColor(...INK);
  doc.setFontSize(9);
  const info: [string, string][] = [
    ["Tienda", kardex.storeName],
    ["Período", formatPeriod(kardex.dateFrom, kardex.dateTo)],
    ["Generado", `${formatDateTime(kardex.generatedAt)}${generatedBy ? ` · ${generatedBy}` : ""}`],
  ];
  let y = 90;
  for (const [label, value] of info) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 54, y);
    y += 13;
  }

  // Totales
  const products = kardex.products;
  const moved = products.filter((product) => product.rows.length > 0).length;
  const withoutCount = products.filter((product) => product.closingBalance === null).length;
  const totalIn = totalsText(products, (product) => product.totalIn);
  const totalOut = totalsText(products, (product) => product.totalOut);
  const gap = 10;
  const boxWidth = (contentWidth - gap * 4) / 5;
  const boxesY = y + 6;
  drawStatBox(doc, margin, boxesY, boxWidth, "Productos", formatInteger(products.length), null, BROWN);
  drawStatBox(doc, margin + (boxWidth + gap), boxesY, boxWidth, "Con movimientos", formatInteger(moved), null, BLUE);
  drawStatBox(doc, margin + (boxWidth + gap) * 2, boxesY, boxWidth, "Entradas", totalIn.main, totalIn.extra, GREEN);
  drawStatBox(doc, margin + (boxWidth + gap) * 3, boxesY, boxWidth, "Salidas", totalOut.main, totalOut.extra, RED);
  drawStatBox(doc, margin + (boxWidth + gap) * 4, boxesY, boxWidth, "Sin conteo", formatInteger(withoutCount), withoutCount ? "saldo desconocido" : null, MUTED);

  // Resumen por producto
  type Cell = string | { content: string; colSpan?: number; styles?: Record<string, unknown> };
  const summary: Cell[][] = [];
  for (const block of byCategory(products)) {
    summary.push([{ content: block.category.toUpperCase(), colSpan: 7, styles: { fillColor: CREAM, fontStyle: "bold", textColor: BROWN } }]);
    for (const product of block.products) {
      summary.push([
        product.productName,
        product.unit === "kg" ? "Kg" : "Unidad",
        formatKardexQuantity(product.openingBalance, product.unit),
        product.totalIn ? `+${formatKardexQuantity(product.totalIn, product.unit)}` : "—",
        product.totalOut ? `−${formatKardexQuantity(product.totalOut, product.unit)}` : "—",
        product.totalAdjustment ? formatSigned(product.totalAdjustment, product.unit) : "—",
        formatKardexQuantity(product.closingBalance, product.unit),
      ]);
    }
  }

  doc.setTextColor(...BROWN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Resumen por producto", margin, boxesY + 76);

  autoTable(doc, {
    startY: boxesY + 84,
    margin: { left: margin, right: margin, top: 84, bottom: 44 },
    head: [["Producto", "Unidad", "Saldo inicial", "Entradas", "Salidas", "Ajustes", "Saldo final"]],
    body: summary as never,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 4, lineColor: CREAM_DARK, lineWidth: 0.5, textColor: INK },
    headStyles: { fillColor: BROWN, textColor: 255, halign: "center" },
    columnStyles: {
      0: { cellWidth: 260 },
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right", textColor: GREEN },
      4: { halign: "right", textColor: RED },
      5: { halign: "right", textColor: BLUE },
      6: { halign: "right", fontStyle: "bold" },
    },
    didDrawPage: () => drawHeader(doc, kardex, margin),
  });

  // Detalle por producto
  const detailed = products.filter((product) => product.rows.length > 0);
  if (detailed.length > 0) {
    doc.addPage();
    drawHeader(doc, kardex, margin);
    y = 92;
    doc.setTextColor(...BROWN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detalle de movimientos", margin, y);
    y += 12;

    for (const product of detailed) {
      if (y > pageHeight - 140) {
        doc.addPage();
        drawHeader(doc, kardex, margin);
        y = 88;
      }
      // Barra del producto
      doc.setFillColor(...CREAM);
      doc.roundedRect(margin, y, contentWidth, 26, 4, 4, "F");
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(product.productName, margin + 10, y + 17);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `${product.categoryName} · ${product.unit === "kg" ? "Kg" : "Unidad"}   ·   Inicial ${formatKardexQuantity(product.openingBalance, product.unit)}   →   Final ${formatKardexQuantity(product.closingBalance, product.unit)}`,
        pageWidth - margin - 10,
        y + 17,
        { align: "right" },
      );

      const body: Cell[][] = [
        [
          { content: "", styles: {} },
          { content: "Saldo inicial", styles: { fontStyle: "bold" } },
          "",
          "",
          "",
          "",
          { content: formatKardexQuantity(product.openingBalance, product.unit), styles: { fontStyle: "bold" } },
        ],
        ...product.rows.map((row): Cell[] => [
          formatDateTime(row.occurredAt),
          row.concept,
          row.reference ?? "",
          row.quantityIn ? `+${formatKardexQuantity(row.quantityIn, product.unit)}` : "",
          row.quantityOut ? `−${formatKardexQuantity(row.quantityOut, product.unit)}` : "",
          row.type === "CONTEO" ? formatSigned(row.adjustment, product.unit) : "",
          formatKardexQuantity(row.balance, product.unit),
        ]),
        [
          "",
          { content: "Saldo final", styles: { fontStyle: "bold" } },
          "",
          { content: product.totalIn ? `+${formatKardexQuantity(product.totalIn, product.unit)}` : "", styles: { fontStyle: "bold" } },
          { content: product.totalOut ? `−${formatKardexQuantity(product.totalOut, product.unit)}` : "", styles: { fontStyle: "bold" } },
          { content: product.totalAdjustment ? formatSigned(product.totalAdjustment, product.unit) : "", styles: { fontStyle: "bold" } },
          { content: formatKardexQuantity(product.closingBalance, product.unit), styles: { fontStyle: "bold", fillColor: CREAM } },
        ],
      ];

      autoTable(doc, {
        startY: y + 30,
        margin: { left: margin, right: margin, top: 84, bottom: 44 },
        head: [["Fecha", "Concepto", "Referencia", "Entrada", "Salida", "Ajuste", "Saldo"]],
        body: body as never,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 3, textColor: INK },
        headStyles: { fillColor: BROWN_SOFT, textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [251, 248, 244] },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 90 },
          3: { halign: "right", textColor: GREEN, cellWidth: 62 },
          4: { halign: "right", textColor: RED, cellWidth: 62 },
          5: { halign: "right", textColor: BLUE, cellWidth: 62 },
          6: { halign: "right", fontStyle: "bold", cellWidth: 70 },
        },
        didDrawPage: () => drawHeader(doc, kardex, margin),
      });
      y = lastY(doc, y) + 18;
    }
  }

  // Firmas
  let signY = lastY(doc, y) + 50;
  if (signY > pageHeight - 70) {
    doc.addPage();
    drawHeader(doc, kardex, margin);
    signY = 160;
  }
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.6);
  const colWidth = 220;
  doc.line(margin, signY, margin + colWidth, signY);
  doc.line(pageWidth - margin - colWidth, signY, pageWidth - margin, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Elaboró (${kardex.storeName})`, margin + colWidth / 2, signY + 13, { align: "center" });
  doc.text("Revisó (Finanzas / Admin)", pageWidth - margin - colWidth / 2, signY + 13, { align: "center" });

  // Pie con paginación
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(...CREAM_DARK);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Xocolatísimo · Kardex ${kardex.storeName} · Saldos según el último conteo físico, ventas del POS y movimientos confirmados.`,
      margin,
      pageHeight - 18,
    );
    doc.text(`Página ${page} de ${pages}`, pageWidth - margin, pageHeight - 18, { align: "right" });
  }

  doc.save(`kardex-${slug(kardex.storeName)}-${kardex.dateFrom}-a-${kardex.dateTo}.pdf`);
}
