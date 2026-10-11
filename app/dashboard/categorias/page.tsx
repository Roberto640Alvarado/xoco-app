"use client";

import { useState } from "react";
import { cn } from "cn";
import { SalesFiltersBar } from "@/features/sales/components/sales-filters";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { CategoryTopProductsChart } from "@/components/charts/category-top-products-chart";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductRankingByCategory } from "@/features/sales/hooks/use-product-ranking-by-category";
import { isoDateDaysAgo, todayIsoDate } from "@/lib/format";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import type { CategoryProductMetric, SalesFilters } from "@/features/sales/types/sales.types";

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

function clampLimit(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.round(value)));
}

const METRIC_OPTIONS: Array<{ value: CategoryProductMetric; label: string }> = [
  { value: "revenue", label: "Por dinero" },
  { value: "quantity", label: "Por unidad" },
];

const METRIC_SUBTITLE: Record<CategoryProductMetric, string> = {
  revenue: "Por ingresos",
  quantity: "Por unidades vendidas",
};

interface MetricToggleProps {
  value: CategoryProductMetric;
  onChange: (value: CategoryProductMetric) => void;
}

// Segmented control de 2 opciones — mismo criterio que el resto del panel
// (sin instalar un componente shadcn nuevo para esto): "Por dinero"
// ordena y muestra ingresos ($, comparable entre un producto por pieza y
// uno a granel); "Por unidad" ordena y muestra la cantidad en la unidad
// propia de cada producto (u/Kg — ver CategoryProduct.unit). Las
// categorías siempre quedan ordenadas por ingresos; esto solo cambia el
// orden y el valor de los PRODUCTOS dentro de cada una.
function MetricToggle({ value, onChange }: MetricToggleProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border p-0.5">
      {METRIC_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "ghost"}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn("h-7 px-3", value !== option.value && "text-muted-foreground")}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

// Se separó de /dashboard/productos (que ya tenía 5 gráficos) porque se
// pidió "el top 10 por categoría" como su propio módulo — ver
// plan-history/2026-09-12-top-productos-por-categoria.md. El toggle
// "Por dinero"/"Por unidad" se agregó después (feedback del negocio):
// antes solo ordenaba por ingresos.
export default function CategoriasPage() {
  const { defaultPosConfigId } = useVendedorStoreFilter();
  const [filters, setFilters] = useState<SalesFilters>({
    dateFrom: isoDateDaysAgo(29),
    dateTo: todayIsoDate(),
    posConfigId: defaultPosConfigId,
  });
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [metric, setMetric] = useState<CategoryProductMetric>("revenue");

  const categories = useProductRankingByCategory(filters, limit, "desc", metric);
  const data = categories.data ?? [];
  const subtitle = METRIC_SUBTITLE[metric];

  return (
    <div className="flex flex-col gap-6">
      <SalesFiltersBar
        page="categorias"
        filters={filters}
        onChange={setFilters}
        actions={
          <ExportExcelButton
            filename="top-productos-por-categoria"
            disabled={categories.isLoading || data.length === 0}
            sheets={() =>
              data.map((category) => ({
                name: category.categoryName,
                rows: category.products.map((product) => ({
                  Producto: product.productName,
                  Ingresos: product.revenue,
                  Cantidad: product.quantity,
                  Unidad: product.unit,
                })),
              }))
            }
          />
        }
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <MetricToggle value={metric} onChange={setMetric} />
          <div className="flex items-center gap-2">
            <Label htmlFor="categoryLimit" className="text-xs text-muted-foreground">
              Mostrar
            </Label>
            <Input
              id="categoryLimit"
              type="number"
              min={MIN_LIMIT}
              max={MAX_LIMIT}
              value={limit}
              onChange={(e) => setLimit(clampLimit(Number(e.target.value)))}
              className="w-16"
            />
            <span className="text-xs text-muted-foreground">por categoría</span>
          </div>
        </div>
      </div>

      {categories.isLoading ? (
        <CategoryTopProductsChart
          products={[]}
          isLoading
          title="Cargando…"
          subtitle={subtitle}
          emptyLabel=""
          metric={metric}
        />
      ) : categories.error ? (
        <div className="rounded-xl border border-border bg-card">
          <ChartErrorState message={categories.error.message} />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          Sin ventas en el rango seleccionado
        </div>
      ) : (
        data.map((category) => (
          <CategoryTopProductsChart
            key={category.categoryId}
            products={category.products}
            isLoading={false}
            title={category.categoryName}
            subtitle={subtitle}
            emptyLabel="Sin productos vendidos en el rango seleccionado"
            metric={metric}
          />
        ))
      )}
    </div>
  );
}
