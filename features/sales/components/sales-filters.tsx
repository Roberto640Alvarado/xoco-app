"use client";

import type { ReactNode } from "react";
import { FilterBar } from "@/components/filters/filter-bar";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { StoreSelect } from "@/components/filters/store-select";
import { useStores } from "../hooks/use-stores";
import { useVendedorStoreFilter } from "../hooks/use-vendedor-store-filter";
import { todayIsoDate } from "@/lib/format";
import type { SalesFilters } from "../types/sales.types";

interface SalesFiltersBarProps {
  filters: SalesFilters;
  onChange: (filters: SalesFilters) => void;
  /** Slot para acciones extra en la misma fila (ej. ExportExcelButton) —
   * cada página decide qué exportar, este componente solo filtra. */
  actions?: ReactNode;
}

export function SalesFiltersBar({ filters, onChange, actions }: SalesFiltersBarProps) {
  const { data: stores, isLoading: storesLoading } = useStores();
  const { isVendedor } = useVendedorStoreFilter();

  return (
    <FilterBar>
      <DateRangeFilter
        value={{ dateFrom: filters.dateFrom, dateTo: filters.dateTo }}
        onChange={({ dateFrom, dateTo }) => onChange({ ...filters, dateFrom, dateTo })}
        maxDate={todayIsoDate()}
      />

      <StoreSelect
        stores={stores}
        isLoading={storesLoading}
        value={filters.posConfigId}
        onChange={(posConfigId) => onChange({ ...filters, posConfigId })}
        lockedToSingleStore={isVendedor}
      />

      {actions && <div className="flex items-center gap-2 sm:ml-auto">{actions}</div>}
    </FilterBar>
  );
}
