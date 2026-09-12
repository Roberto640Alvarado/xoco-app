"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { useCustomerSearch } from "@/features/sales/hooks/use-customer-search";
import { formatCurrency, formatInteger, isoDateDaysAgo, todayIsoDate } from "@/lib/format";

const MIN_QUERY_LENGTH = 2;

// Buscador general de compradores: cualquier partner de Odoo con
// facturas en el rango, no solo los clientes de mayoreo fijos de
// /dashboard/ventas-mayoreo — ver plan-history
// "buscador-compradores-efectivo-otros-medios".
export default function BuscarCompradoresPage() {
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState(isoDateDaysAgo(29));
  const [dateTo, setDateTo] = useState(todayIsoDate());

  const search = useCustomerSearch({ q, dateFrom, dateTo, limit: 30 });
  const results = search.data ?? [];
  const showHint = q.trim().length < MIN_QUERY_LENGTH;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-sm font-medium text-foreground">Buscar compradores</h1>
        <p className="text-xs text-muted-foreground">
          Cualquier cliente con facturas en el rango de fechas, por nombre.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <Label htmlFor="customerQuery" className="text-xs text-muted-foreground">
            Nombre del cliente
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="customerQuery"
              type="text"
              placeholder="Ej. Selectos, Calleja, Ana..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="customerDateFrom" className="text-xs text-muted-foreground">
            Desde
          </Label>
          <Input
            id="customerDateFrom"
            type="date"
            value={dateFrom}
            max={dateTo}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-[150px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="customerDateTo" className="text-xs text-muted-foreground">
            Hasta
          </Label>
          <Input
            id="customerDateTo"
            type="date"
            value={dateTo}
            min={dateFrom}
            max={todayIsoDate()}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-[150px]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        {showHint ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Escribe al menos {MIN_QUERY_LENGTH} caracteres para buscar
          </div>
        ) : search.isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>Cliente (empresa matriz)</TableHead>
                <TableHead>Facturas</TableHead>
                <TableHead>Ingresos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeletonRows rows={5} columns={4} />
            </TableBody>
          </Table>
        ) : results.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Sin resultados para &ldquo;{q.trim()}&rdquo; en el rango seleccionado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>Cliente (empresa matriz)</TableHead>
                <TableHead>Facturas</TableHead>
                <TableHead>Ingresos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.partnerId}>
                  <TableCell>{result.partnerName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {result.commercialPartnerId === result.partnerId
                      ? "—"
                      : result.commercialPartnerName}
                  </TableCell>
                  <TableCell>{formatInteger(result.visits)}</TableCell>
                  <TableCell>{formatCurrency(result.amountTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
