"use client";

import { useState } from "react";
import { SalesFiltersBar } from "@/features/sales/components/sales-filters";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { ProductRankingChart } from "@/components/charts/product-ranking-chart";
import { ProductWeightRankingChart } from "@/components/charts/product-weight-ranking-chart";
import { ProductMonthlyComparisonChart } from "@/components/charts/product-monthly-comparison-chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductRanking } from "@/features/sales/hooks/use-product-ranking";
import { useProductRankingByWeight } from "@/features/sales/hooks/use-product-ranking-by-weight";
import { useProductMonthlyComparison } from "@/features/sales/hooks/use-product-monthly-comparison";
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
  const [weightTopLimit, setWeightTopLimit] = useState(DEFAULT_LIMIT);
  const [weightBottomLimit, setWeightBottomLimit] = useState(DEFAULT_LIMIT);
  const [monthlyLimit, setMonthlyLimit] = useState(DEFAULT_LIMIT);

  const topProducts = useProductRanking(filters, topLimit, "desc");
  const bottomProducts = useProductRanking(filters, bottomLimit, "asc");
  const weightTopProducts = useProductRankingByWeight(filters, weightTopLimit, "desc");
  const weightBottomProducts = useProductRankingByWeight(filters, weightBottomLimit, "asc");
  const monthlyComparison = useProductMonthlyComparison(filters.posConfigId, monthlyLimit);

  return (
    <div className="flex flex-col gap-6">
      <SalesFiltersBar
        filters={filters}
        onChange={setFilters}
        actions={
          <ExportExcelButton
            filename="mejores-productos"
            sheets={() => [
              {
                name: "Más vendidos",
                rows: (topProducts.data ?? []).map((p) => ({
                  Producto: p.productName,
                  Unidades: p.totalQuantity,
                  Ingresos: p.totalRevenue,
                })),
              },
              {
                name: "Menos vendidos",
                rows: (bottomProducts.data ?? []).map((p) => ({
                  Producto: p.productName,
                  Unidades: p.totalQuantity,
                  Ingresos: p.totalRevenue,
                })),
              },
              {
                name: "Granel más vendido",
                rows: (weightTopProducts.data ?? []).map((p) => ({
                  Producto: p.productName,
                  Kg: p.totalKg,
                  Ingresos: p.totalRevenue,
                })),
              },
              {
                name: "Granel menos vendido",
                rows: (weightBottomProducts.data ?? []).map((p) => ({
                  Producto: p.productName,
                  Kg: p.totalKg,
                  Ingresos: p.totalRevenue,
                })),
              },
              {
                name: "Comparación mensual",
                rows: (monthlyComparison.data ?? []).map((p) => ({
                  Producto: p.productName,
                  "Unidades mes actual": p.currentMonth.quantity,
                  "Ingresos mes actual": p.currentMonth.revenue,
                  "Unidades mes anterior": p.previousMonth.quantity,
                  "Ingresos mes anterior": p.previousMonth.revenue,
                })),
              },
            ]}
          />
        }
      />

      <ProductMonthlyComparisonChart
        data={monthlyComparison.data ?? []}
        isLoading={monthlyComparison.isLoading}
        errorMessage={monthlyComparison.error?.message}
        title="Comparación mensual por producto"
        emptyLabel="Sin ventas en el mes en curso"
      />
      <div className="flex justify-end -mt-4">
        <LimitInput id="monthlyLimit" value={monthlyLimit} onChange={setMonthlyLimit} />
      </div>

      <ProductRankingChart
        data={topProducts.data ?? []}
        isLoading={topProducts.isLoading}
        errorMessage={topProducts.error?.message}
        title="Productos más vendidos"
        subtitle="Por unidades vendidas"
        emptyLabel="Sin productos vendidos en el rango seleccionado"
        headerExtra={<LimitInput id="topLimit" value={topLimit} onChange={setTopLimit} />}
      />

      <ProductRankingChart
        data={bottomProducts.data ?? []}
        isLoading={bottomProducts.isLoading}
        errorMessage={bottomProducts.error?.message}
        title="Productos menos vendidos"
        subtitle="Por unidades vendidas"
        emptyLabel="Sin productos vendidos en el rango seleccionado"
        headerExtra={<LimitInput id="bottomLimit" value={bottomLimit} onChange={setBottomLimit} />}
      />

      <ProductWeightRankingChart
        data={weightTopProducts.data ?? []}
        isLoading={weightTopProducts.isLoading}
        errorMessage={weightTopProducts.error?.message}
        title="Productos a granel más vendidos"
        subtitle="Por Kg vendidos (ej. Crocks) — no compiten con el ranking por unidades"
        emptyLabel="Sin productos a granel vendidos en el rango seleccionado"
        headerExtra={<LimitInput id="weightTopLimit" value={weightTopLimit} onChange={setWeightTopLimit} />}
      />

      <ProductWeightRankingChart
        data={weightBottomProducts.data ?? []}
        isLoading={weightBottomProducts.isLoading}
        errorMessage={weightBottomProducts.error?.message}
        title="Productos a granel menos vendidos"
        subtitle="Por Kg vendidos"
        emptyLabel="Sin productos a granel vendidos en el rango seleccionado"
        headerExtra={<LimitInput id="weightBottomLimit" value={weightBottomLimit} onChange={setWeightBottomLimit} />}
      />
    </div>
  );
}
