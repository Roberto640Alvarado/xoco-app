import * as XLSX from "xlsx";

/** Una hoja del archivo: filas ya formateadas como el usuario las verá
 * (strings/números listos para mostrar) — el llamador decide qué formatear. */
export interface ExportSheet {
  name: string;
  rows: Array<Record<string, string | number | null | undefined>>;
}

/** Recorta a 31 caracteres y quita [ ] : * ? / \\ — restricciones de Excel
 * para el nombre de una hoja. */
function safeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Hoja";
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${i})`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    i += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

/** Genera y descarga un .xlsx real (SheetJS) con una o varias hojas.
 * `filename` sin extensión — se agrega ".xlsx". */
export function exportRowsToExcel(filename: string, sheets: ExportSheet[]): void {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows);
    // Ancho de columna aproximado según el contenido más largo de cada
    // columna (incluye el encabezado) — Excel no lo calcula solo al abrir.
    const headers = Object.keys(sheet.rows[0]);
    worksheet["!cols"] = headers.map((header) => {
      const longest = sheet.rows.reduce((max, row) => {
        const value = row[header];
        const length = value == null ? 0 : String(value).length;
        return Math.max(max, length);
      }, header.length);
      return { wch: Math.min(Math.max(longest + 2, 10), 40) };
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(sheet.name, usedNames));
  }

  if (workbook.SheetNames.length === 0) {
    // Nada que exportar: al menos deja una hoja vacía en vez de que
    // XLSX.writeFile explote por "workbook has no sheets".
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Sin datos"]]), "Sin datos");
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
