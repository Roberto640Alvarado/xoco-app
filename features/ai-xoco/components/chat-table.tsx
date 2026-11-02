import { cn } from "@/lib/utils";
import type { AiTable } from "../types/ai-chat.types";
import { formatValue } from "./value-format";
import { CopyButton } from "./copy-button";
import { tableToTsv } from "../lib/copy-text";

/** Tabla que pidió Xoco IA. Números alineados a la derecha; scroll horizontal en celular. */
export function ChatTable({ table }: { table: AiTable }) {
  return (
    <figure className="w-full overflow-hidden rounded-2xl border border-border bg-card">
      <figcaption className="flex items-center justify-between gap-2 border-b border-border py-1.5 pl-4 pr-2 text-sm font-semibold text-foreground">
        <span className="min-w-0 truncate">{table.titulo}</span>
        <CopyButton value={tableToTsv(table)} label="Copiar tabla" variant="ghost" size="sm" className="shrink-0 text-xs font-normal text-muted-foreground" />
      </figcaption>
      <div className="max-h-96 overflow-auto">
        <table className="w-full min-w-max border-collapse text-[13px]">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur">
            <tr>
              {table.columnas.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    "px-3 py-2 text-left text-xs font-semibold text-muted-foreground",
                    column.formato && column.formato !== "texto" && "text-right",
                  )}
                >
                  {column.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.filas.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border/60 even:bg-muted/20">
                {row.map((cell, cellIndex) => {
                  const format = table.columnas[cellIndex]?.formato;
                  const numeric = typeof cell === "number" && format !== "texto";
                  return (
                    <td key={cellIndex} className={cn("px-3 py-2 text-foreground", numeric && "text-right tabular-nums")}>
                      {formatValue(cell, format)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.nota && <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{table.nota}</p>}
    </figure>
  );
}
