"use client"

import type { ReactNode } from "react"
import { cn } from "cn"

interface FilterToolbarProps {
  /** Texto que explica qué muestra la sección (ej. "Meta mensual..."). */
  description: ReactNode
  /** Controles a la derecha: navegador de mes, selects, botón de exportar, etc. */
  children: ReactNode
  className?: string
}

/** Barra de encabezado de sección reutilizada en Tráfico de tiendas, Venta
 * Mensual, Ticket Promedio, Mayoreo, Cierre de mes y Venta/Tráfico/Ticket
 * Diario — antes cada vista repetía el mismo div de card + layout. */
export function FilterToolbar({ description, children, className }: FilterToolbarProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className
      )}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-sidebar-primary/70" />
      <p className="pl-2.5 text-sm text-muted-foreground sm:max-w-md sm:pr-4">{description}</p>
      <div className="flex flex-wrap items-center gap-2 pl-2.5 sm:pl-0">{children}</div>
    </div>
  )
}
