"use client";

import { useState } from "react";
import { ArrowDownToLine, ClipboardCheck, Cookie, Gift, PackageX, ShoppingCart } from "lucide-react";
import { cn } from "cn";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { DateRangeFilter, type DateRangeValue } from "@/components/filters/date-range-filter";
import { ExportExcelButton } from "@/components/ui/export-excel-button";
import { ChartErrorState } from "@/components/ui/chart-error-state";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  CONTEO: "Conteo",
};

const TYPE_ICON: Record<InventoryLedgerEntryType, typeof PackageX> = {
  VENTA: ShoppingCart,
  MERMA: PackageX,
  REGALIA: Gift,
  DEGUSTACION: Cookie,
  ENTRADA: ArrowDownToLine,
  CONTEO: ClipboardCheck,
};

const STATUS_LABEL = { PENDIENTE: "Pendiente", RECIBIDO: "Recibido", CONFIRMADO: "Confirmado", RECHAZADO: "Rechazado" } as const;

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
}

// Registro de entradas y salidas de una tienda — una línea de tiempo con
// la fecha y hora de cada venta (Odoo), movimiento manual y conteo físico.
// Los movimientos RECHAZADOS o PENDIENTES se muestran con su estado: solo
// los CONFIRMADOS afectan la existencia estimada.
export function InventoryLedger({ posConfigId, storeName }: InventoryLedgerProps) {
  const [range, setRange] = useState<DateRangeValue>({ dateFrom: isoDateDaysAgo(6), dateTo: todayIsoDate() });
  const [productId, setProductId] = useState<number | undefined>(undefined);
  const [type, setType] = useState<InventoryLedgerEntryType | undefined>(undefined);

  const { data: items } = useInventoryItems(posConfigId);
  const ledger = useInventoryLedger({ posConfigId, ...range, productId, type });
  const entries = ledger.data ?? [];

  const productLabel = (raw: string) => items?.find((item) => String(item.productId) === raw)?.productName ?? raw;

  return (
    <div className="flex flex-col gap-4">
      <FilterToolbar description="Registro de entradas y salidas de la tienda, con fecha y hora de cada venta, movimiento y conteo.">
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
      </FilterToolbar>

      {ledger.isError ? (
        <ChartErrorState message={ledger.error?.message} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="max-h-[65vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Registrado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.isLoading ? (
                  <TableSkeletonRows rows={6} columns={7} />
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                      No hay movimientos en este rango.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const Icon = TYPE_ICON[entry.type];
                    const quantity = signedQuantity(entry);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(entry.occurredAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            {TYPE_LABEL[entry.type]}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-normal">{entry.productName}</TableCell>
                        <TableCell className={cn("text-right font-medium tabular-nums", quantity.className)}>
                          {quantity.text}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {entry.status ? STATUS_LABEL[entry.status] : "—"}
                        </TableCell>
                        <TableCell className="max-w-[220px] whitespace-normal text-muted-foreground">
                          {entry.detail ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {entry.registeredBy ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
