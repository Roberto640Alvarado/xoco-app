"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStores } from "../hooks/use-stores";
import { isoDateDaysAgo, todayIsoDate } from "@/lib/format";
import type { SalesFilters } from "../types/sales.types";

const PRESETS = [
  { label: "7 días", days: 6 },
  { label: "30 días", days: 29 },
  { label: "90 días", days: 89 },
];

const ALL_STORES = "all";

interface SalesFiltersBarProps {
  filters: SalesFilters;
  onChange: (filters: SalesFilters) => void;
}

export function SalesFiltersBar({ filters, onChange }: SalesFiltersBarProps) {
  const { data: stores, isLoading: storesLoading } = useStores();
  const storeValue = filters.posConfigId ? String(filters.posConfigId) : ALL_STORES;

  function applyPreset(days: number) {
    onChange({ ...filters, dateFrom: isoDateDaysAgo(days), dateTo: todayIsoDate() });
  }

  // El <Select> de base-ui solo resuelve el label de la opción seleccionada
  // contra un mapa `items` (o `itemToStringLabel`) pasado al Root — sin eso
  // cae a mostrar el `value` crudo ("2" en vez de "Sucursal Escalón") en
  // cuanto el popup se cierra y los <SelectItem> se desmontan. Como la
  // lista de tiendas es dinámica (viene de /sales/stores), es más simple
  // resolver el label acá con un children-función en <SelectValue /> que
  // declarar un mapa `items` aparte.
  function storeLabel(value: string): string {
    if (value === ALL_STORES) return "Todas las tiendas";
    const store = stores?.find((s) => String(s.id) === value);
    return store?.name ?? value;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:contents">
        <div className="flex flex-col gap-1 sm:flex-none">
          <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
            Desde
          </Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="w-full sm:w-[150px]"
          />
        </div>

        <div className="flex flex-col gap-1 sm:flex-none">
          <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
            Hasta
          </Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom}
            max={todayIsoDate()}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="w-full sm:w-[150px]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Tienda</Label>
        <Select
          value={storeValue}
          onValueChange={(value) =>
            onChange({
              ...filters,
              posConfigId: value === ALL_STORES ? undefined : Number(value),
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={storesLoading ? "Cargando..." : "Todas las tiendas"}>
              {(value: string) => (storesLoading ? "Cargando..." : storeLabel(value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STORES}>Todas las tiendas</SelectItem>
            {stores?.map((store) => (
              <SelectItem key={store.id} value={String(store.id)}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
