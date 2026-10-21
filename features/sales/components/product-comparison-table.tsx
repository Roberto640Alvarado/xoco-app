"use client";

import { DataTable, type DataTableColumn } from "@/design-system/components/data-table";
import { ChangeIndicator } from "@/design-system/components/change-indicator";
import { formatCurrency, formatInteger } from "@/lib/format";
import type { ProductComparisonItem } from "../types/sales.types";
import { computeChange } from "../utils/comparison-periods";

interface ProductComparisonTableProps {
  items: ProductComparisonItem[];
  labelA: string;
  labelB: string;
  isLoading: boolean;
}

function signed(value: number, format: (value: number) => string): string {
  if (value === 0) return format(0);
  return `${value > 0 ? "+" : "−"}${format(Math.abs(value))}`;
}

function ChangeCell({ a, b, format }: { a: number; b: number; format: (value: number) => string }) {
  const change = computeChange(a, b);
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      <span className="tabular-nums text-foreground">{signed(change.diff, format)}</span>
      <ChangeIndicator diff={change.diff} pct={change.pct} />
    </span>
  );
}

/**
 * Tabla completa de la comparación: todos los productos vendidos en
 * cualquiera de los dos períodos (la gráfica solo muestra el top elegido),
 * con unidades e ingresos de cada período y su cambio. Recibe las filas ya
 * ordenadas por la pantalla.
 */
export function ProductComparisonTable({ items, labelA, labelB, isLoading }: ProductComparisonTableProps) {
  const columns: DataTableColumn<ProductComparisonItem>[] = [
    {
      id: "product",
      header: "Producto",
      label: "Producto",
      cell: (row) => <span className="font-medium text-foreground">{row.productName}</span>,
      accessor: (row) => row.productName,
      filter: "text",
      mobile: "title",
    },
    {
      id: "quantityA",
      header: `Unid. ${labelA}`,
      label: `Unidades ${labelA}`,
      cell: (row) => formatInteger(row.periodA.quantity),
      align: "right",
      nowrap: true,
    },
    {
      id: "quantityB",
      header: `Unid. ${labelB}`,
      label: `Unidades ${labelB}`,
      cell: (row) => formatInteger(row.periodB.quantity),
      align: "right",
      nowrap: true,
    },
    {
      id: "quantityChange",
      header: "Cambio unid.",
      label: "Cambio en unidades",
      cell: (row) => <ChangeCell a={row.periodA.quantity} b={row.periodB.quantity} format={formatInteger} />,
      align: "right",
      nowrap: true,
    },
    {
      id: "revenueA",
      header: `Ingresos ${labelA}`,
      label: `Ingresos ${labelA}`,
      cell: (row) => formatCurrency(row.periodA.revenue),
      align: "right",
      nowrap: true,
    },
    {
      id: "revenueB",
      header: `Ingresos ${labelB}`,
      label: `Ingresos ${labelB}`,
      cell: (row) => formatCurrency(row.periodB.revenue),
      align: "right",
      nowrap: true,
    },
    {
      id: "revenueChange",
      header: "Cambio $",
      label: "Cambio en ingresos",
      cell: (row) => <ChangeCell a={row.periodA.revenue} b={row.periodB.revenue} format={formatCurrency} />,
      align: "right",
      nowrap: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={items}
      getRowKey={(row) => row.productId}
      isLoading={isLoading}
      emptyMessage="Sin productos vendidos en ninguno de los dos períodos"
      itemLabel={{ singular: "producto", plural: "productos" }}
      defaultPageSize={25}
    />
  );
}
