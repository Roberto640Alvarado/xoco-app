"use client";

import { useMemo, useState } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { AlertTriangle, DollarSign, ListOrdered, Package } from "lucide-react";
import { ReportHeader } from "@/features/page-guide/components/report-header";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { StoreSelect } from "@/components/filters/store-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductComparisonChart } from "@/components/charts/product-comparison-chart";
import { ComparisonStat } from "@/design-system/components/comparison-stat";
import { NoticeCard } from "@/design-system/components/notice-card";
import { Panel } from "@/design-system/components/panel";
import { SegmentedControl, type SegmentedOption } from "@/design-system/components/segmented-control";
import { formatCurrency, formatInteger } from "@/lib/format";
import { useProductComparison } from "../hooks/use-product-comparison";
import { useStores } from "../hooks/use-stores";
import { useVendedorStoreFilter } from "../hooks/use-vendedor-store-filter";
import type {
  ProductComparisonItem,
  ProductComparisonMetric,
  ProductComparisonPeriods,
  ProductComparisonSort,
} from "../types/sales.types";
import {
  computeChange,
  DEFAULT_COMPARISON_PRESET,
  formatPeriodLabel,
  isIsoDate,
  todayLocalIso,
  validatePeriods,
} from "../utils/comparison-periods";
import { PeriodComparisonFilter } from "./period-comparison-filter";
import { ProductComparisonTable } from "./product-comparison-table";

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

const METRIC_OPTIONS: SegmentedOption<ProductComparisonMetric>[] = [
  { value: "quantity", label: "Unidades" },
  { value: "revenue", label: "Ingresos" },
];

const SORT_LABEL: Record<ProductComparisonSort, string> = {
  periodA: "Más vendidos en A",
  growth: "Mayor crecimiento",
  decline: "Mayor caída",
};

function clampLimit(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.round(value)));
}

function sortItems(items: ProductComparisonItem[], sort: ProductComparisonSort, metric: ProductComparisonMetric) {
  const diff = (item: ProductComparisonItem) => item.periodA[metric] - item.periodB[metric];
  return [...items].sort((x, y) => {
    if (sort === "growth") return diff(y) - diff(x);
    if (sort === "decline") return diff(x) - diff(y);
    return y.periodA[metric] - x.periodA[metric] || y.periodB[metric] - x.periodB[metric];
  });
}

// Filtros en la URL (nuqs): un link compartido abre la misma comparación.
// `tienda` se ignora para el Vendedor — siempre ve la suya (y la API lo
// fuerza igual con scopedPosConfigId).
const URL_PARSERS = {
  aDesde: parseAsString,
  aHasta: parseAsString,
  bDesde: parseAsString,
  bHasta: parseAsString,
  tienda: parseAsInteger,
};

/**
 * Pantalla Productos → Comparación: compara, producto por producto, dos
 * períodos elegidos (por defecto el mes actual contra el anterior). Arriba
 * los totales de cada período, luego la gráfica del top elegido y, al final,
 * la tabla con todos los productos.
 */
export function ProductComparisonView() {
  const [today] = useState(todayLocalIso);
  const { data: stores, isLoading: storesLoading } = useStores();
  const { isVendedor, defaultPosConfigId } = useVendedorStoreFilter();
  const [query, setQuery] = useQueryStates(URL_PARSERS);

  const periods = useMemo<ProductComparisonPeriods>(() => {
    const { aDesde, aHasta, bDesde, bHasta } = query;
    if (isIsoDate(aDesde) && isIsoDate(aHasta) && isIsoDate(bDesde) && isIsoDate(bHasta)) {
      return { a: { dateFrom: aDesde, dateTo: aHasta }, b: { dateFrom: bDesde, dateTo: bHasta } };
    }
    return DEFAULT_COMPARISON_PRESET.periods(today);
  }, [query, today]);
  const periodsError = validatePeriods(periods);
  const posConfigId = isVendedor ? defaultPosConfigId : (query.tienda ?? undefined);

  const [metric, setMetric] = useState<ProductComparisonMetric>("quantity");
  const [sort, setSort] = useState<ProductComparisonSort>("periodA");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const comparison = useProductComparison(periods, posConfigId, !periodsError);
  const data = comparison.data;
  const items = useMemo(() => sortItems(data?.items ?? [], sort, metric), [data, sort, metric]);

  let labelA = formatPeriodLabel(periods.a, today);
  let labelB = formatPeriodLabel(periods.b, today);
  if (labelA === labelB) {
    labelA = `${labelA} (A)`;
    labelB = `${labelB} (B)`;
  }

  function changePeriods(next: ProductComparisonPeriods) {
    void setQuery({ aDesde: next.a.dateFrom, aHasta: next.a.dateTo, bDesde: next.b.dateFrom, bHasta: next.b.dateTo });
  }

  const isLoading = !periodsError && comparison.isLoading;
  const isError = comparison.isError;
  const totalsA = data?.periodA;
  const totalsB = data?.periodB;

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader page="comparacion-productos">
        <PeriodComparisonFilter value={periods} onChange={changePeriods} />
        <StoreSelect
          stores={stores}
          isLoading={storesLoading}
          value={posConfigId}
          onChange={(tienda) => void setQuery({ tienda: tienda ?? null })}
          lockedToSingleStore={isVendedor}
        />
        <ExportExcelButton
          filename="comparacion-de-productos"
          disabled={isLoading || !data}
          sheets={() => [
            {
              name: "Resumen",
              rows: [
                { Indicador: "Período", [labelA]: `${periods.a.dateFrom} a ${periods.a.dateTo}`, [labelB]: `${periods.b.dateFrom} a ${periods.b.dateTo}` },
                { Indicador: "Unidades", [labelA]: totalsA?.quantity ?? 0, [labelB]: totalsB?.quantity ?? 0 },
                { Indicador: "Ingresos", [labelA]: totalsA?.revenue ?? 0, [labelB]: totalsB?.revenue ?? 0 },
                { Indicador: "Productos vendidos", [labelA]: totalsA?.productCount ?? 0, [labelB]: totalsB?.productCount ?? 0 },
              ],
            },
            {
              name: "Productos",
              rows: items.map((item) => ({
                Producto: item.productName,
                [`Unidades ${labelA}`]: item.periodA.quantity,
                [`Unidades ${labelB}`]: item.periodB.quantity,
                "Cambio unidades": item.periodA.quantity - item.periodB.quantity,
                [`Ingresos ${labelA}`]: item.periodA.revenue,
                [`Ingresos ${labelB}`]: item.periodB.revenue,
                "Cambio ingresos": Math.round((item.periodA.revenue - item.periodB.revenue) * 100) / 100,
              })),
            },
          ]}
        />
      </ReportHeader>

      {periodsError ? (
        <NoticeCard tone="warning" icon={AlertTriangle} title="Revisa los períodos" description={periodsError} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ComparisonStat
            icon={Package}
            label="Unidades vendidas"
            value={formatInteger(totalsA?.quantity ?? 0)}
            compareValue={formatInteger(totalsB?.quantity ?? 0)}
            valueLabel={labelA}
            compareLabel={labelB}
            change={computeChange(totalsA?.quantity ?? 0, totalsB?.quantity ?? 0)}
            isLoading={isLoading}
            isError={isError}
          />
          <ComparisonStat
            icon={DollarSign}
            label="Ingresos"
            value={formatCurrency(totalsA?.revenue ?? 0)}
            compareValue={formatCurrency(totalsB?.revenue ?? 0)}
            valueLabel={labelA}
            compareLabel={labelB}
            change={computeChange(totalsA?.revenue ?? 0, totalsB?.revenue ?? 0)}
            isLoading={isLoading}
            isError={isError}
          />
          <ComparisonStat
            icon={ListOrdered}
            label="Productos distintos vendidos"
            value={formatInteger(totalsA?.productCount ?? 0)}
            compareValue={formatInteger(totalsB?.productCount ?? 0)}
            valueLabel={labelA}
            compareLabel={labelB}
            change={computeChange(totalsA?.productCount ?? 0, totalsB?.productCount ?? 0)}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
      )}

      <Panel
        title="Comparación por producto"
        description={`${labelA} vs. ${labelB}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl ariaLabel="Medir por" options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
            <Select value={sort} onValueChange={(next) => setSort(next as ProductComparisonSort)}>
              <SelectTrigger className="h-8 w-[180px]" aria-label="Ordenar por">
                <SelectValue>{(raw: string) => SORT_LABEL[raw as ProductComparisonSort]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABEL) as ProductComparisonSort[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label htmlFor="comparisonLimit" className="text-xs text-muted-foreground">
                Mostrar
              </Label>
              <Input
                id="comparisonLimit"
                type="number"
                min={MIN_LIMIT}
                max={MAX_LIMIT}
                value={limit}
                onChange={(e) => setLimit(clampLimit(Number(e.target.value)))}
                className="h-8 w-16"
              />
            </div>
          </div>
        }
      >
        <ProductComparisonChart
          items={items.slice(0, limit)}
          metric={metric}
          labelA={labelA}
          labelB={labelB}
          isLoading={isLoading}
          errorMessage={periodsError ? null : comparison.error?.message}
          emptyLabel={periodsError ? "Corrige los períodos para ver la comparación" : "Sin ventas en ninguno de los dos períodos"}
        />
      </Panel>

      <Panel title="Todos los productos" description="Unidades e ingresos de cada período y su cambio." flush>
        <ProductComparisonTable items={items} labelA={labelA} labelB={labelB} isLoading={isLoading} />
      </Panel>
    </div>
  );
}
