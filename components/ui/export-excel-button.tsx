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
   * click, útil si el cálculo de filas es costoso) o el arreglo directo.
   * La función puede ser async: ej. traer TODAS las páginas de un listado
   * paginado por la API con los mismos filtros de la pantalla. */
  sheets: ExportSheet[] | (() => ExportSheet[] | Promise<ExportSheet[]>)
  disabled?: boolean
  className?: string
  size?: "sm" | "default"
  label?: string
  /** Ancla para el tour guiado (data-tour). */
  tourId?: string
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
  tourId,
}: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const errorId = React.useId()

  async function handleClick() {
    setIsExporting(true)
    setError(null)
    try {
      const resolved = typeof sheets === "function" ? await sheets() : sheets
      const stamp = new Date().toISOString().slice(0, 10);
      exportRowsToExcel(`${filename}-${stamp}`, resolved)
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "No se pudo generar el Excel. Intenta de nuevo.")
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
      data-tour={tourId}
      title={error ?? undefined}
      aria-describedby={error ? errorId : undefined}
      className={cn("border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300", className)}
    >
      <ExcelIcon />
      {isExporting ? "Generando..." : error ? "Reintentar" : label}
      {error && <span id={errorId} className="sr-only" role="alert">{error}</span>}
    </Button>
  )
}
