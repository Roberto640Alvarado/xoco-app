"use client";

import { useState } from "react";
import { SalesFiltersBar } from "@/features/sales/components/sales-filters";
import { isoDateDaysAgo, todayIsoDate } from "@/lib/format";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import type { SalesFilters } from "@/features/sales/types/sales.types";

// Módulo nuevo, todavía sin reporte propio. Se dejan ya los filtros
// generales (mismo SalesFiltersBar — fecha + tienda, con el mismo lock a
// la tienda propia para Vendedor — que usa el resto del dashboard) para
// no tener que retocar el layout de la página cuando se implemente el
// contenido real; mientras tanto solo muestra "En desarrollo...".
export default function InventarioPage() {
  const { defaultPosConfigId } = useVendedorStoreFilter();
  const [filters, setFilters] = useState<SalesFilters>({
    dateFrom: isoDateDaysAgo(29),
    dateTo: todayIsoDate(),
    posConfigId: defaultPosConfigId,
  });

  return (
    <div className="flex flex-col gap-6">
      <SalesFiltersBar filters={filters} onChange={setFilters} />

      <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
        En desarrollo...
      </div>
    </div>
  );
}
