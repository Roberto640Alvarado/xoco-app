"use client";

import type { ReactNode } from "react";
import { ReportHeader } from "@/features/page-guide/components/report-header";
import type { ReportPageKey } from "@/features/page-guide/content";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { StoreSelect } from "@/components/filters/store-select";
import { useStores } from "../hooks/use-stores";
import { useVendedorStoreFilter } from "../hooks/use-vendedor-store-filter";
import { todayIsoDate } from "@/lib/format";
import type { SalesFilters } from "../types/sales.types";

interface SalesFiltersBarProps {
  /** Sección a la que pertenece: define el título, el tour y el modal de ayuda. */
  page: ReportPageKey;
  filters: SalesFilters;
  onChange: (filters: SalesFilters) => void;
  /** Slot para acciones extra en la misma fila (ej. ExportExcelButton) —
   * cada página decide qué exportar, este componente solo filtra. */
  actions?: ReactNode;
}

export function SalesFiltersBar({ page, filters, onChange, actions }: SalesFiltersBarProps) {
  const { data: stores, isLoading: storesLoading } = useStores();
  const { isVendedor } = useVendedorStoreFilter();

  return (
    <ReportHeader page={page}>
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

      {actions}
    </ReportHeader>
  );
}
