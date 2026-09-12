"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ExcelIcon } from "@/components/ui/excel-icon"
import { exportRowsToExcel, type ExportSheet } from "@/lib/export-xlsx"
import { cn } from "cn"

interface ExportExcelButtonProps {
  /** Nombre del archivo SIN extensión — se agrega ".xlsx". */
  filename: string
  /** Hojas a exportar. Puede ser una función (se evalúa recién al hacer
   * click, útil si el cálculo de filas es costoso) o el arreglo directo. */
  sheets: ExportSheet[] | (() => ExportSheet[])
  disabled?: boolean
  className?: string
  size?: "sm" | "default"
  label?: string
}

/** Botón de exportar a Excel reutilizable en cualquier filter toolbar —
 * genera el .xlsx en el navegador con SheetJS, sin pedir nada al backend. */
export function ExportExcelButton({
  filename,
  sheets,
  disabled,
  className,
  size = "sm",
  label = "Exportar",
}: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false)

  function handleClick() {
    setIsExporting(true)
    try {
      const resolved = typeof sheets === "function" ? sheets() : sheets
      const stamp = new Date().toISOString().slice(0, 10);
      exportRowsToExcel(`${filename}-${stamp}`, resolved)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleClick}
      disabled={disabled || isExporting}
      className={cn("border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300", className)}
    >
      <ExcelIcon />
      {isExporting ? "Generando..." : label}
    </Button>
  )
}
