"use client"

import { Store as StoreIcon } from "lucide-react"
import { cn } from "cn"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Store } from "@/features/sales/types/sales.types"

const ALL_STORES = "all"

interface StoreSelectProps {
  stores?: Store[]
  isLoading?: boolean
  value: number | undefined
  onChange: (value: number | undefined) => void
  className?: string
  /** Para un usuario Vendedor: no tiene sentido ofrecer "Todas las
   * tiendas" (el backend igual lo ignoraría y forzaría su única
   * tienda) ni dejar el selector interactivo si solo hay una opción
   * real — se oculta ese ítem y se deshabilita el trigger. */
  lockedToSingleStore?: boolean
  /** Para vistas donde SIEMPRE hace falta una tienda específica (ej.
   * Inventario: cada producto se captura por tienda, nunca en agregado)
   * pero el usuario sí puede cambiar de tienda — a diferencia de
   * lockedToSingleStore, esto NO deshabilita el trigger. */
  hideAllStoresOption?: boolean
}

/** Select de tienda reutilizado en todos los filter toolbars — mismo
 * criterio de resolución de label que ya tenían SalesFiltersBar /
 * DailyTrafficView etc: el <Select> de base-ui necesita un children-
 * función en <SelectValue /> porque la lista de tiendas es dinámica. */
export function StoreSelect({
  stores,
  isLoading,
  value,
  onChange,
  className,
  lockedToSingleStore,
  hideAllStoresOption,
}: StoreSelectProps) {
  const stringValue = value ? String(value) : ALL_STORES
  const hideAllStores = lockedToSingleStore || hideAllStoresOption

  function storeLabel(raw: string): string {
    if (raw === ALL_STORES) return "Todas las tiendas"
    const store = stores?.find((s) => String(s.id) === raw)
    return store?.name ?? raw
  }

  const placeholder = isLoading ? "Cargando..." : hideAllStores ? "Selecciona una tienda" : "Todas las tiendas"

  return (
    <Select
      value={stringValue}
      onValueChange={(next) => onChange(next === ALL_STORES ? undefined : Number(next))}
      disabled={lockedToSingleStore}
    >
      <SelectTrigger className={cn("w-full gap-2 sm:w-[190px]", className)}>
        <StoreIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <SelectValue placeholder={placeholder}>
          {(raw: string) => (isLoading ? "Cargando..." : storeLabel(raw))}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {!hideAllStores && <SelectItem value={ALL_STORES}>Todas las tiendas</SelectItem>}
        {stores?.map((store) => (
          <SelectItem key={store.id} value={String(store.id)}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
