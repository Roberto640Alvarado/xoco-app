"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"

interface MonthNavigatorProps {
  label: string
  onPrevious: () => void
  onNext: () => void
  nextDisabled?: boolean
  className?: string
}

/** Control de mes anterior/siguiente reutilizado en Tráfico de tiendas,
 * Venta Mensual, Ticket Promedio, Mayoreo, Cierre de mes, Venta/Tráfico/
 * Ticket Diario — antes era el mismo bloque de JSX copiado en cada
 * archivo, ahora vive en un solo lugar. */
export function MonthNavigator({ label, onPrevious, onNext, nextDisabled, className }: MonthNavigatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5 shadow-xs",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onPrevious}
        aria-label="Mes anterior"
        className="rounded-md"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <span className="min-w-[7.5rem] px-1 text-center text-sm font-medium text-foreground capitalize">
        {label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label="Mes siguiente"
        className="rounded-md"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
