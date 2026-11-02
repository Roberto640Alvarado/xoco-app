"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, Coins, Database, Hash, MessageSquareText, Receipt, Users, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/design-system/components/section-card";
import { SegmentedControl } from "@/design-system/components/segmented-control";
import { InfoBadge } from "@/design-system/components/info-badge";
import { TablePagination } from "@/design-system/components/table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";
import { formatDateTime, formatInteger, formatShortDate } from "@/lib/format";
import type { ApiError } from "@/lib/api/client";
import { useAiUsage } from "../hooks/use-ai-admin";
import type { AiUsageItem } from "../types/ai-admin.types";
import type { AiProviderKey } from "../types/ai-chat.types";
import { ProviderIcon } from "./provider-icon";

type Preset = "hoy" | "7d" | "mes" | "mes-pasado";
const ALL_USERS = "todos";

const STORE_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" });
const compact = new Intl.NumberFormat("es-SV", { notation: "compact", maximumFractionDigits: 1 });

function shift(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function rangeFor(preset: Preset): { dateFrom: string; dateTo: string } {
  const today = STORE_DATE.format(new Date());
  if (preset === "hoy") return { dateFrom: today, dateTo: today };
  if (preset === "7d") return { dateFrom: shift(today, -6), dateTo: today };
  if (preset === "mes") return { dateFrom: `${today.slice(0, 7)}-01`, dateTo: today };
  const lastOfPrev = shift(`${today.slice(0, 7)}-01`, -1);
  return { dateFrom: `${lastOfPrev.slice(0, 7)}-01`, dateTo: lastOfPrev };
}

/** Dólares; por debajo de $1, 4 decimales (las consultas cuestan centavos). */
export function formatUsd(value: number): string {
  const digits = Math.abs(value) < 1 && value !== 0 ? 4 : 2;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

const PROVIDERS: { key: AiProviderKey; label: string; color: string }[] = [
  { key: "claude", label: "Claude", color: "#c46a4a" },
  { key: "openai", label: "ChatGPT", color: "#2f9e72" },
];
const PROVIDER = Object.fromEntries(PROVIDERS.map((item) => [item.key, item])) as Record<AiProviderKey, (typeof PROVIDERS)[number]>;

const STATUS_BADGE: Record<AiUsageItem["status"], { tone: "success" | "danger" | "neutral"; label: string }> = {
  OK: { tone: "success", label: "Respondida" },
  ERROR: { tone: "danger", label: "Error" },
  DETENIDA: { tone: "neutral", label: "Detenida" },
};

function Kpi({ icon: Icon, label, value, detail, loading }: { icon: LucideIcon; label: string; value: string; detail?: string; loading: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <span className="truncate text-xl font-semibold tabular-nums text-foreground sm:text-2xl" title={value}>
          {value}
        </span>
      )}
      {detail && !loading && <span className="truncate text-xs text-muted-foreground">{detail}</span>}
    </div>
  );
}

function ProviderLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      {PROVIDERS.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5">
          <span style={{ color: item.color }}>
            <ProviderIcon provider={item.key} className="size-3.5" />
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}

function DayTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey?: string; value?: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  const total = payload.reduce((sum, item) => sum + (item.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{formatShortDate(label)}</p>
      {payload.map((item) => {
        const provider = PROVIDER[item.dataKey as AiProviderKey];
        if (!provider) return null;
        return (
          <p key={provider.key} className="flex items-center gap-1.5 text-muted-foreground">
            <span style={{ color: provider.color }}>
              <ProviderIcon provider={provider.key} className="size-3" />
            </span>
            {provider.label}: <span className="font-medium text-foreground">{formatUsd(item.value ?? 0)}</span>
          </p>
        );
      })}
      <p className="mt-1 border-t border-border pt-1 font-medium text-foreground">Total: {formatUsd(total)}</p>
    </div>
  );
}

// Xoco IA → Gasto (solo Super admin): cuánto se lleva gastado en Xoco IA,
// por día, por IA y por usuario, y el registro de consultas (sin el texto de
// lo que preguntó cada quien).
export function AiUsageView() {
  const [preset, setPreset] = useState<Preset>("mes");
  const [provider, setProvider] = useState<"todas" | AiProviderKey>("todas");
  const [userId, setUserId] = useState<string>(ALL_USERS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const filters = useMemo(
    () => ({
      ...rangeFor(preset),
      provider: provider === "todas" ? undefined : provider,
      userId: userId === ALL_USERS ? undefined : userId,
      page: page + 1,
      limit: pageSize,
    }),
    [preset, provider, userId, page, pageSize],
  );
  const { data, isLoading, isError, error } = useAiUsage(filters);
  const totals = data?.totals;
  const users = data?.byUser ?? [];
  const maxUserCost = Math.max(...users.map((user) => user.costUsd), 0);
  const providerTotal = (data?.byProvider ?? []).reduce((sum, item) => sum + item.costUsd, 0);
  const userLabel = (id: string) => {
    const user = users.find((item) => item.userId === id);
    return user ? user.userName ?? user.userEmail : "Usuario";
  };

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(0);
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard icon={Coins} title="Gasto de IA" description="Cuánto se ha gastado en Xoco IA: por día, por IA y por usuario.">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel="Período"
            value={preset}
            onChange={resetPage(setPreset)}
            options={[
              { value: "hoy", label: "Hoy" },
              { value: "7d", label: "7 días" },
              { value: "mes", label: "Este mes" },
              { value: "mes-pasado", label: "Mes pasado" },
            ]}
          />
          <SegmentedControl
            ariaLabel="Inteligencia artificial"
            value={provider}
            onChange={resetPage(setProvider)}
            options={[
              { value: "todas", label: "Todas" },
              ...PROVIDERS.map((item) => ({ value: item.key, label: item.label, icon: <ProviderIcon provider={item.key} className="size-3.5" /> })),
            ]}
          />
          <Select value={userId} onValueChange={(next) => resetPage(setUserId)(String(next ?? ALL_USERS))}>
            <SelectTrigger className="h-8 w-full min-w-44 sm:w-auto" aria-label="Usuario">
              <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <SelectValue>{(raw: string) => (!raw || raw === ALL_USERS ? "Todos los usuarios" : userLabel(raw))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_USERS}>Todos los usuarios</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.userId} value={user.userId}>
                  {user.userName ?? user.userEmail}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      {isError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(error as unknown as ApiError)?.message ?? "No se pudo cargar el gasto."}
        </p>
      )}

      {/* Números clave */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Coins} label="Gasto" value={totals ? formatUsd(totals.costUsd) : "—"} detail="Estimado en dólares" loading={isLoading} />
        <Kpi
          icon={MessageSquareText}
          label="Consultas"
          value={totals ? formatInteger(totals.queries) : "—"}
          detail={totals?.errors ? `${totals.errors} con error` : "Preguntas a Xoco IA"}
          loading={isLoading}
        />
        <Kpi icon={Receipt} label="Promedio" value={totals ? formatUsd(totals.averageCostUsd) : "—"} detail="Por consulta" loading={isLoading} />
        <Kpi
          icon={Hash}
          label="Tokens"
          value={totals ? compact.format(totals.inputTokens + totals.outputTokens) : "—"}
          detail={totals ? `${compact.format(totals.inputTokens)} entrada · ${compact.format(totals.outputTokens)} salida` : undefined}
          loading={isLoading}
        />
      </div>

      {/* Gasto por día + por IA */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Gasto por día</h2>
            <ProviderLegend />
          </div>
          {isLoading ? (
            <ChartSkeleton height={240} />
          ) : (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byDay ?? []} margin={{ left: 4, right: 4, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tickFormatter={(value: number) => formatUsd(value)} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={64} />
                <Tooltip content={<DayTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                <Bar dataKey="claude" name="Claude" stackId="g" fill={PROVIDER.claude.color} maxBarSize={36} />
                <Bar dataKey="openai" name="ChatGPT" stackId="g" fill={PROVIDER.openai.color} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Por IA</h2>
          {isLoading && [0, 1].map((index) => <Skeleton key={index} className="h-12 w-full rounded-lg" />)}
          {!isLoading && PROVIDERS.map((item) => {
            const row = data?.byProvider.find((entry) => entry.provider === item.key);
            const share = providerTotal ? ((row?.costUsd ?? 0) / providerTotal) * 100 : 0;
            return (
              <div key={item.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span style={{ color: item.color }}>
                      <ProviderIcon provider={item.key} className="size-4" />
                    </span>
                    <span className="truncate font-medium text-foreground">{item.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-foreground">{formatUsd(row?.costUsd ?? 0)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${share}%`, background: item.color }} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {row ? `${formatInteger(row.queries)} consultas · ${row.model}` : "Sin consultas"}
                </span>
              </div>
            );
          })}
        </section>
      </div>

      {/* Por usuario */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Por usuario
        </h2>
        {isLoading ? (
          <div className="grid gap-2 md:grid-cols-2">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin consultas en el período.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {users.map((user) => {
              const selected = userId === user.userId;
              return (
                <li key={user.userId}>
                  <button
                    type="button"
                    onClick={() => resetPage(setUserId)(selected ? ALL_USERS : user.userId)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${selected ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"}`}
                  >
                    <UserAvatar name={user.userName} email={user.userEmail} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{user.userName ?? user.userEmail}</span>
                        <span className="shrink-0 text-sm tabular-nums text-foreground">{formatUsd(user.costUsd)}</span>
                      </span>
                      <span className="h-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-foreground/60" style={{ width: `${maxUserCost ? (user.costUsd / maxUserCost) * 100 : 0}%` }} />
                      </span>
                      <span className="text-xs text-muted-foreground">{formatInteger(user.queries)} consultas</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Registro de consultas */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Registro de consultas</h2>
          {userId !== ALL_USERS && <span className="text-xs text-muted-foreground">De {userLabel(userId)}</span>}
        </div>

        {/* Celular: tarjetas */}
        <ul className="flex flex-col divide-y divide-border border-t border-border md:hidden">
          {isLoading &&
            [0, 1, 2].map((index) => (
              <li key={index} className="px-4 py-3">
                <Skeleton className="h-10 w-full" />
              </li>
            ))}
          {(data?.items ?? []).map((item) => (
            <li key={item.id} className="flex flex-col gap-1.5 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                  <span style={{ color: PROVIDER[item.provider].color }}>
                    <ProviderIcon provider={item.provider} className="size-4" />
                  </span>
                  <span className="truncate">{item.userName ?? item.userEmail}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatUsd(item.costUsd)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{formatDateTime(item.createdAt)}</span>
                <span>{compact.format(item.inputTokens + item.outputTokens)} tokens</span>
                <InfoBadge tone={STATUS_BADGE[item.status].tone} size="sm">
                  {STATUS_BADGE[item.status].label}
                </InfoBadge>
              </div>
            </li>
          ))}
        </ul>

        {/* Escritorio: tabla */}
        <div className="hidden max-h-[32rem] overflow-auto md:block">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/90 text-xs text-muted-foreground backdrop-blur">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">Fecha y hora</th>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">Usuario</th>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">IA</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Consultas a datos</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Duración</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Tokens</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Costo</th>
                <th scope="col" className="px-4 py-2.5 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableSkeletonRows rows={6} columns={8} />}
              {(data?.items ?? []).map((item) => (
                <tr key={item.id} className="border-t border-border/60 transition-colors hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-foreground">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <UserAvatar name={item.userName} email={item.userEmail} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{item.userName ?? item.userEmail}</span>
                        {item.userName && <span className="block truncate text-xs text-muted-foreground">{item.userEmail}</span>}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <span style={{ color: PROVIDER[item.provider].color }}>
                        <ProviderIcon provider={item.provider} className="size-4" />
                      </span>
                      {PROVIDER[item.provider].label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Database className="h-3 w-3" aria-hidden="true" />
                      {item.toolCalls}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {(item.durationMs / 1000).toFixed(1)} s
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-muted-foreground" title={`${formatInteger(item.inputTokens)} entrada · ${formatInteger(item.outputTokens)} salida`}>
                    {compact.format(item.inputTokens + item.outputTokens)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">{formatUsd(item.costUsd)}</td>
                  <td className="px-4 py-2.5">
                    <span title={item.errorMessage ?? undefined}>
                      <InfoBadge tone={STATUS_BADGE[item.status].tone} size="sm" dot>
                        {STATUS_BADGE[item.status].label}
                      </InfoBadge>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(data?.items ?? []).length === 0 && !isLoading && (
          <p className="border-t border-border px-4 py-10 text-center text-sm text-muted-foreground">Todavía no hay consultas a Xoco IA en este período.</p>
        )}

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={data?.total ?? 0}
          pageRowCount={data?.items.length ?? 0}
          itemLabel={{ singular: "consulta", plural: "consultas" }}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      </section>
    </div>
  );
}
