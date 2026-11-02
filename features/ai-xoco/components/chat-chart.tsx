"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AiChart } from "../types/ai-chat.types";
import { formatValue } from "./value-format";

// Paleta de gráficas de Xoco (tokens --chart-1..5 de globals.css).
const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; payload?: { fill?: string } }[];
  label?: string;
  format?: AiChart["formato"];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      {payload.map((item, index) => (
        <p key={index} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color ?? item.payload?.fill }} />
          {item.name}: <span className="font-medium text-foreground">{formatValue(item.value ?? null, format)}</span>
        </p>
      ))}
    </div>
  );
}

/** Gráfica que pidió Xoco IA (barras, líneas, área o pastel). */
export function ChatChart({ chart }: { chart: AiChart }) {
  const rows = chart.etiquetas.map((label, index) => {
    const row: Record<string, string | number> = { label };
    chart.series.forEach((serie, serieIndex) => {
      row[`s${serieIndex}`] = serie.valores[index] ?? 0;
    });
    return row;
  });
  const tick = { fontSize: 11, fill: "var(--muted-foreground)" };
  const yTick = (value: number) => formatValue(value, chart.formato, true);
  const multi = chart.series.length > 1;

  let content: React.ReactElement;
  if (chart.tipo === "pastel") {
    const data = chart.etiquetas.map((label, index) => ({ name: label, value: chart.series[0]?.valores[index] ?? 0 }));
    content = (
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="80%" paddingAngle={2}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip format={chart.formato} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    );
  } else {
    const common = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={yTick} width={64} />
        <Tooltip content={<ChartTooltip format={chart.formato} />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
        {multi && <Legend wrapperStyle={{ fontSize: 12 }} />}
      </>
    );
    if (chart.tipo === "barras") {
      content = (
        <BarChart data={rows}>
          {common}
          {chart.series.map((serie, index) => (
            <Bar key={index} dataKey={`s${index}`} name={serie.nombre} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={44} />
          ))}
        </BarChart>
      );
    } else if (chart.tipo === "area") {
      content = (
        <AreaChart data={rows}>
          {common}
          {chart.series.map((serie, index) => (
            <Area key={index} type="monotone" dataKey={`s${index}`} name={serie.nombre} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
          ))}
        </AreaChart>
      );
    } else {
      content = (
        <LineChart data={rows}>
          {common}
          {chart.series.map((serie, index) => (
            <Line key={index} type="monotone" dataKey={`s${index}`} name={serie.nombre} stroke={COLORS[index % COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
          ))}
        </LineChart>
      );
    }
  }

  return (
    <figure className="w-full rounded-2xl border border-border bg-card p-3 sm:p-4">
      <figcaption className="mb-2 text-sm font-semibold text-foreground">{chart.titulo}</figcaption>
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {content}
        </ResponsiveContainer>
      </div>
      {chart.nota && <p className="mt-2 text-xs text-muted-foreground">{chart.nota}</p>}
    </figure>
  );
}
