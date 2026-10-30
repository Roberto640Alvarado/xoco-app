"use client";

import { useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowRightLeft, ClipboardCheck, Cookie, Gift, PackageX, ShoppingCart } from "lucide-react";
import { cn } from "cn";
import { SectionCard } from "@/design-system/components/section-card";
import { DateRangeFilter, type DateRangeValue } from "@/components/filters/date-range-filter";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { InfoHint } from "@/features/inventory-guide/components/info-hint";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/design-system/components/data-table";
import { useInventoryItems } from "@/features/inventory/hooks/use-inventory-items";
import { formatDateTime, formatInteger, formatKg, isoDateDaysAgo, todayIsoDate } from "@/lib/format";
import { useInventoryLedger } from "../hooks/use-inventory-ledger";
import type { InventoryLedgerEntry, InventoryLedgerEntryType } from "../types/inventory-ledger.types";

const ALL = "all";

const TYPE_LABEL: Record<InventoryLedgerEntryType, string> = {
  VENTA: "Venta",
  MERMA: "Merma",
  REGALIA: "Regalía",
  DEGUSTACION: "Degustación",
  ENTRADA: "Entrada",
  TRASLADO: "Traslado a otra tienda",
  CONTEO: "Conteo",
};

const TYPE_ICON: Record<InventoryLedgerEntryType, typeof PackageX> = {
  VENTA: ShoppingCart,
  MERMA: PackageX,
  REGALIA: Gift,
  DEGUSTACION: Cookie,
  ENTRADA: ArrowDownToLine,
  TRASLADO: ArrowRightLeft,
  CONTEO: ClipboardCheck,
};

const STATUS_LABEL = { PENDIENTE: "Pendiente", EN_CAMINO: "En camino", RECIBIDO: "Recibido", CONFIRMADO: "Confirmado", RECHAZADO: "Rechazado" } as const;

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? formatInteger(quantity) : formatKg(quantity);
}

// Cantidad con signo y color: + verde para entradas, − para salidas, y el
// valor contado tal cual (sin signo) para un conteo físico.
function signedQuantity(entry: InventoryLedgerEntry): { text: string; className: string } {
  const text = formatQuantity(entry.quantity);
  if (entry.direction === "IN") return { text: `+${text}`, className: "text-emerald-600 dark:text-emerald-400" };
  if (entry.direction === "OUT") return { text: `−${text}`, className: "text-foreground" };
  return { text, className: "text-muted-foreground" };
}

interface InventoryLedgerProps {
  posConfigId: number;
  storeName?: string;
  /** Controles extra al inicio de la barra (ej. el selector de tienda), para
   * que todos los filtros vivan en una sola card. */
  leading?: ReactNode;
}

// Registro de entradas y salidas de una tienda — una línea de tiempo con
// la fecha y hora de cada venta (Odoo), movimiento manual y conteo físico.
// Los movimientos RECHAZADOS o PENDIENTES se muestran con su estado: solo
// los CONFIRMADOS afectan la existencia estimada.
export function InventoryLedger({ posConfigId, storeName, leading }: InventoryLedgerProps) {
  const [range, setRange] = useState<DateRangeValue>({ dateFrom: isoDateDaysAgo(6), dateTo: todayIsoDate() });
  const [productId, setProductId] = useState<number | undefined>(undefined);
  const [type, setType] = useState<InventoryLedgerEntryType | undefined>(undefined);

  const { data: items } = useInventoryItems(posConfigId);
  const ledger = useInventoryLedger({ posConfigId, ...range, productId, type });
  const entries = ledger.data ?? [];

  const productLabel = (raw: string) => items?.find((item) => String(item.productId) === raw)?.productName ?? raw;

  const typeOptions = (Object.keys(TYPE_LABEL) as InventoryLedgerEntryType[]).map((key) => ({
    value: TYPE_LABEL[key],
    label: TYPE_LABEL[key],
  }));
  const statusOptions = Object.values(STATUS_LABEL).map((label) => ({ value: label, label }));

  const columns: DataTableColumn<InventoryLedgerEntry>[] = [
    {
      id: "date",
      header: "Fecha y hora",
      label: "Fecha y hora",
      cell: (entry) => <span className="text-muted-foreground">{formatDateTime(entry.occurredAt)}</span>,
      accessor: (entry) => formatDateTime(entry.occurredAt),
      filter: "text",
      nowrap: true,
    },
    {
      id: "type",
      header: (
        <span className="inline-flex items-center gap-1">
          Tipo
          <InfoHint topic="registro-tipos" />
        </span>
      ),
      label: "Tipo",
      cell: (entry) => {
        const Icon = TYPE_ICON[entry.type];
        return (
          <span className="inline-flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {TYPE_LABEL[entry.type]}
          </span>
        );
      },
      accessor: (entry) => TYPE_LABEL[entry.type],
      filter: "select",
      filterOptions: typeOptions,
      nowrap: true,
      tourId: "ledger-type",
    },
    {
      id: "product",
      header: "Producto",
      label: "Producto",
      cell: (entry) => entry.productName,
      accessor: (entry) => entry.productName,
      filter: "text",
      mobile: "title",
    },
    {
      id: "quantity",
      header: "Cantidad",
      label: "Cantidad",
      cell: (entry) => {
        const quantity = signedQuantity(entry);
        return <span className={cn("font-medium tabular-nums", quantity.className)}>{quantity.text}</span>;
      },
      align: "right",
      nowrap: true,
    },
    {
      id: "status",
      header: "Estado",
      label: "Estado",
      cell: (entry) => <span className="text-muted-foreground">{entry.status ? STATUS_LABEL[entry.status] : "—"}</span>,
      accessor: (entry) => (entry.status ? STATUS_LABEL[entry.status] : ""),
      filter: "select",
      filterOptions: statusOptions,
      nowrap: true,
    },
    {
      id: "detail",
      header: "Detalle",
      label: "Detalle",
      cell: (entry) => <span className="text-muted-foreground">{entry.detail ?? "—"}</span>,
      accessor: (entry) => entry.detail ?? "",
      filter: "text",
      className: "max-w-[220px]",
    },
    {
      id: "registeredBy",
      header: "Registrado por",
      label: "Registrado por",
      cell: (entry) => <span className="text-muted-foreground">{entry.registeredBy ?? "—"}</span>,
      accessor: (entry) => entry.registeredBy ?? "",
      filter: "text",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionCard controlsOnly tourId="ledger-toolbar">
        {leading}
        <DateRangeFilter value={range} onChange={setRange} />
        <Select
          value={productId ? String(productId) : ALL}
          onValueChange={(next) => setProductId(next === ALL ? undefined : Number(next))}
        >
          <SelectTrigger className="w-full gap-2 sm:w-[220px]">
            <SelectValue>{(raw: string) => (raw === ALL ? "Todos los productos" : productLabel(raw))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los productos</SelectItem>
            {items?.map((item) => (
              <SelectItem key={item.productId} value={String(item.productId)}>
                {item.productName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type ?? ALL}
          onValueChange={(next) => setType(next === ALL ? undefined : (next as InventoryLedgerEntryType))}
        >
          <SelectTrigger className="w-full gap-2 sm:w-[160px]">
            <SelectValue>{(raw: string) => (raw === ALL ? "Todos los tipos" : TYPE_LABEL[raw as InventoryLedgerEntryType])}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            {(Object.keys(TYPE_LABEL) as InventoryLedgerEntryType[]).map((key) => (
              <SelectItem key={key} value={key}>
                {TYPE_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ExportExcelButton
          filename={`registro-inventario${storeName ? `-${storeName}` : ""}`}
          disabled={ledger.isLoading || entries.length === 0}
          sheets={() => [
            {
              name: "Registro",
              rows: entries.map((entry) => ({
                "Fecha y hora": formatDateTime(entry.occurredAt),
                Tipo: TYPE_LABEL[entry.type],
                Producto: entry.productName,
                Cantidad: entry.direction === "OUT" ? -entry.quantity : entry.quantity,
                Estado: entry.status ? STATUS_LABEL[entry.status] : "",
                Detalle: entry.detail ?? "",
                "Registrado por": entry.registeredBy ?? "",
              })),
            },
          ]}
        />
      </SectionCard>

      {ledger.isError ? (
        <ChartErrorState message={ledger.error?.message} />
      ) : (
        <DataTable
          columns={columns}
          rows={entries}
          getRowKey={(entry) => entry.id}
          isLoading={ledger.isLoading}
          emptyMessage="No hay movimientos en este rango."
          itemLabel={{ singular: "registro", plural: "registros" }}
          tourId="ledger-table"
        />
      )}
    </div>
  );
}
