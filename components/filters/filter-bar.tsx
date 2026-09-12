"use client"

import type { ReactNode } from "react"
import { cn } from "cn"

interface FilterBarProps {
  children: ReactNode
  className?: string
}

/** Contenedor de fila de controles de filtro (rango de fechas, tienda,
 * búsqueda...) — mismo estilo de card que FilterToolbar, pero pensado
 * para inputs alineados en fila en vez de una descripción + acciones. */
export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:flex-wrap sm:items-end",
        className
      )}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-sidebar-primary/70" />
      <div className="flex w-full flex-col gap-3 pl-2.5 sm:flex-row sm:flex-wrap sm:items-end">{children}</div>
    </div>
  )
}
