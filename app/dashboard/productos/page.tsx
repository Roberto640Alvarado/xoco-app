"use client";

import { useState } from "react";
import { SalesFiltersBar } from "@/features/sales/components/sales-filters";
import { ProductRankingChart } from "@/components/charts/product-ranking-chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductRanking } from "@/features/sales/hooks/use-product-ranking";
import { isoDateDaysAgo, todayIsoDate } from "@/lib/format";
import type { SalesFilters } from "@/features/sales/types/sales.types";

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

function clampLimit(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.round(value)));
}

interface LimitInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
}

function LimitInput({ id, value, onChange }: LimitInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        Mostrar
      </Label>
      <Input
        id={id}
        type="number"
        min={MIN_LIMIT}
        max={MAX_LIMIT}
        value={value}
        onChange={(e) => onChange(clampLimit(Number(e.target.value)))}
        className="w-16"
      />
    </div>
  );
}

export default function ProductosPage() {
  const [filters, setFilters] = useState<SalesFilters>({
    dateFrom: isoDateDaysAgo(29),
    dateTo: todayIsoDate(),
  });
  const [topLimit, setTopLimit] = useState(DEFAULT_LIMIT);
  const [bottomLimit, setBottomLimit] = useState(DEFAULT_LIMIT);

  const topProducts = useProductRanking(filters, topLimit, "desc");
  const bottomProducts = useProductRanking(filters, bottomLimit, "asc");

  return (
    <div className="flex flex-col gap-6">
      <SalesFiltersBar filters={filters} onChange={setFilters} />

      <ProductRankingChart
        data={topProducts.data ?? []}
        isLoading={topProducts.isLoading}
        title="Productos más vendidos"
        subtitle="Por unidades vendidas"
        emptyLabel="Sin productos vendidos en el rango seleccionado"
        headerExtra={<LimitInput id="topLimit" value={topLimit} onChange={setTopLimit} />}
      />

      <ProductRankingChart
        data={bottomProducts.data ?? []}
        isLoading={bottomProducts.isLoading}
        title="Productos menos vendidos"
        subtitle="Por unidades vendidas"
        emptyLabel="Sin productos vendidos en el rango seleccionado"
        headerExtra={<LimitInput id="bottomLimit" value={bottomLimit} onChange={setBottomLimit} />}
      />
    </div>
  );
}
