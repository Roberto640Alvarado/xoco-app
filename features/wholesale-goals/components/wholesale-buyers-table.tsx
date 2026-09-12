"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatInteger } from "@/lib/format";
import type { WholesaleClientTotals } from "../types/wholesale-goals.types";

// Cuántos compradores se ven sin expandir — Selectos puede traer ~40
// sucursales (ver plan-history), Operadora del Sur solo 1 (factura
// directo a su propia razón social, sin sub-contactos).
const VISIBLE_BUYERS = 8;

interface ClientBuyersCardProps {
  client: WholesaleClientTotals;
}

function ClientBuyersCard({ client }: ClientBuyersCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = client.buyers.length > VISIBLE_BUYERS;
  const visibleBuyers = expanded ? client.buyers : client.buyers.slice(0, VISIBLE_BUYERS);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium text-foreground">{client.clientLabel} — por comprador</h3>
        <span className="text-xs text-muted-foreground">
          {formatInteger(client.buyers.length)} comprador{client.buyers.length === 1 ? "" : "es"} ·{" "}
          {formatCurrency(client.amountTotal)} en total
        </span>
      </div>

      {client.buyers.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          Sin facturas en el rango seleccionado
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>Facturas</TableHead>
                <TableHead>Ingresos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleBuyers.map((buyer) => (
                <TableRow key={buyer.partnerId}>
                  <TableCell>{buyer.partnerName}</TableCell>
                  <TableCell>{formatInteger(buyer.visits)}</TableCell>
                  <TableCell>{formatCurrency(buyer.amountTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasMore && (
            <div className="mt-2 flex justify-center">
              <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    Ver los {client.buyers.length - VISIBLE_BUYERS} compradores restantes
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface WholesaleBuyersTableProps {
  clients: WholesaleClientTotals[];
  isLoading: boolean;
}

// Desglose "por comprador" de cada cliente de mayoreo (ej. cada sucursal
// de Selectos) — un bloque por cliente, mismo rango de fecha que la tabla
// de Meta de arriba. Es lo que pidió el negocio como "ver por sus
// clientes o los compradores".
export function WholesaleBuyersTable({ clients, isLoading }: WholesaleBuyersTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comprador</TableHead>
              <TableHead>Facturas</TableHead>
              <TableHead>Ingresos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeletonRows rows={4} columns={3} />
          </TableBody>
        </Table>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
        Sin clientes de mayoreo configurados.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {clients.map((client) => (
        <ClientBuyersCard key={client.clientKey} client={client} />
      ))}
    </div>
  );
}
