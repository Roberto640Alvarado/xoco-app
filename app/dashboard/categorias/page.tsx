"use client";

import { useState } from "react";
import { SalesFiltersBar } from "@/features/sales/components/sales-filters";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { CategoryTopProductsChart } from "@/components/charts/category-top-products-chart";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductRankingByCategory } from "@/features/sales/hooks/use-product-ranking-by-category";
import { isoDateDaysAgo, todayIsoDate } from "@/lib/format";
import { useVendedorStoreFilter } from "@/features/sales/hooks/use-vendedor-store-filter";
import type { SalesFilters } from "@/features/sales/types/sales.types";

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

function clampLimit(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.round(value)));
}

// Se separó de /dashboard/productos (que ya tenía 5 gráficos) porque se
// pidió "el top 10 por categoría" como su propio módulo — ver
// plan-history/2026-09-12-top-productos-por-categoria.md.
export default function CategoriasPage() {
  const { defaultPosConfigId } = useVendedorStoreFilter();
  const [filters, setFilters] = useState<SalesFilters>({
    dateFrom: isoDateDaysAgo(29),
    dateTo: todayIsoDate(),
    posConfigId: defaultPosConfigId,
  });
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const categories = useProductRankingByCategory(filters, limit, "desc");
  const data = categories.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <SalesFiltersBar
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
                })),
              }))
            }
          />
        }
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-medium text-foreground">Top productos por categoría</h1>
          <p className="text-xs text-muted-foreground">
            Categorías ordenadas por venta total; dentro de cada una, sus productos por ingresos.
          </p>
        </div>
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

      {categories.isLoading ? (
        <CategoryTopProductsChart
          products={[]}
          isLoading
          title="Cargando…"
          subtitle="Por ingresos"
          emptyLabel=""
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
            subtitle="Por ingresos"
            emptyLabel="Sin productos vendidos en el rango seleccionado"
          />
        ))
      )}
    </div>
  );
}
