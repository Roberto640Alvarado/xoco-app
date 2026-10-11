"use client";

import { History } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/design-system/components/data-table";
import { InfoBadge, type InfoBadgeTone } from "@/design-system/components/info-badge";
import { Panel } from "@/design-system/components/panel";
import { formatDateTime, formatLongDate } from "@/lib/format";
import { useOdooConfigHistory } from "../hooks/use-odoo-config-history";
import type { OdooConfigHistoryItem } from "../types/odoo-config.types";

type KeyState = "Activa" | "Vencida" | "Reemplazada";

function keyState(item: OdooConfigHistoryItem): KeyState {
  if (!item.isActive) return "Reemplazada";
  return item.isExpired ? "Vencida" : "Activa";
}

const STATE_TONE: Record<KeyState, InfoBadgeTone> = {
  Activa: "success",
  Vencida: "danger",
  Reemplazada: "neutral",
};

const COLUMNS: DataTableColumn<OdooConfigHistoryItem>[] = [
  {
    id: "createdAt",
    header: "Registrada",
    label: "Registrada",
    cell: (item) => <span className="text-muted-foreground">{formatDateTime(item.createdAt)}</span>,
    accessor: (item) => formatDateTime(item.createdAt),
    filter: "text",
    nowrap: true,
  },
  {
    id: "apiKey",
    header: "API key",
    label: "API key",
    cell: (item) => <span className="font-mono text-foreground">{item.apiKeyMasked}</span>,
    accessor: (item) => item.apiKeyMasked,
    filter: "text",
    mobile: "title",
  },
  {
    id: "uid",
    header: "uid",
    label: "uid de Odoo",
    cell: (item) => item.uid,
    nowrap: true,
  },
  {
    id: "duration",
    header: "Duración",
    label: "Duración",
    cell: (item) => `${item.durationDays} días`,
    nowrap: true,
  },
  {
    id: "expiresAt",
    header: "Expira",
    label: "Expira",
    cell: (item) => <span className="text-muted-foreground">{formatLongDate(item.expiresAt.slice(0, 10))}</span>,
    nowrap: true,
  },
  {
    id: "createdBy",
    header: "Registrada por",
    label: "Registrada por",
    cell: (item) => <span className="text-muted-foreground">{item.createdByEmail ?? "Sin dato"}</span>,
    accessor: (item) => item.createdByEmail ?? "Sin dato",
    filter: "text",
  },
  {
    id: "state",
    header: "Estado",
    label: "Estado",
    cell: (item) => {
      const state = keyState(item);
      return (
        <InfoBadge tone={STATE_TONE[state]} dot>
          {state}
        </InfoBadge>
      );
    },
    accessor: (item) => keyState(item),
    filter: "select",
    nowrap: true,
  },
];

// Historial de API keys de Odoo: la activa y las reemplazadas, para que
// quede registro de cuándo se rotó y quién lo hizo. Usa la tabla estándar.
export function OdooConfigHistory() {
  const history = useOdooConfigHistory();

  return (
    <Panel
      flush
      tourId="odoo-history"
      icon={History}
      title="Historial de API keys"
      description="La activa y las anteriores, siempre enmascaradas."
    >
      {history.isError ? (
        <p className="p-5 text-sm text-destructive">No se pudo cargar el historial.</p>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={history.data ?? []}
          getRowKey={(item) => item.id}
          isLoading={history.isLoading}
          emptyMessage="Todavía no hay API keys registradas."
          itemLabel={{ singular: "key", plural: "keys" }}
          className="rounded-none border-0 shadow-none"
        />
      )}
    </Panel>
  );
}
