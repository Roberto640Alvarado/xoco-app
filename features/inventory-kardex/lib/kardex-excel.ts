import type { ExportSheet } from "@/lib/export-xlsx";
import { formatDateTime } from "@/lib/format";
import type { Kardex } from "../types/inventory-kardex.types";

const unitLabel = (unit: "unidad" | "kg") => (unit === "kg" ? "Kg" : "Unidad");

/** Dos hojas: el resumen por producto y el detalle línea por línea (con saldo). */
export function kardexSheets(kardex: Kardex): ExportSheet[] {
  return [
    {
      name: "Resumen",
      rows: kardex.products.map((product) => ({
        Categoría: product.categoryName,
        Producto: product.productName,
        Unidad: unitLabel(product.unit),
        "Saldo inicial": product.openingBalance ?? "Sin conteo",
        Entradas: product.totalIn,
        Salidas: product.totalOut,
        "Ajustes por conteo": product.totalAdjustment,
        "Saldo final": product.closingBalance ?? "Sin conteo",
      })),
    },
    {
      name: "Kardex",
      rows: kardex.products.flatMap((product) => [
        {
          Categoría: product.categoryName,
          Producto: product.productName,
          Fecha: "",
          Concepto: "Saldo inicial",
          Referencia: "",
          Entrada: "",
          Salida: "",
          Ajuste: "",
          Saldo: product.openingBalance ?? "Sin conteo",
          "Registró": "",
        },
        ...product.rows.map((row) => ({
          Categoría: product.categoryName,
          Producto: product.productName,
          Fecha: formatDateTime(row.occurredAt),
          Concepto: row.concept,
          Referencia: row.reference ?? "",
          Entrada: row.quantityIn || "",
          Salida: row.quantityOut || "",
          Ajuste: row.adjustment ?? "",
          Saldo: row.balance ?? "Sin conteo",
          "Registró": row.registeredBy ?? (row.type === "VENTA" ? "POS" : ""),
        })),
      ]),
    },
  ];
}
