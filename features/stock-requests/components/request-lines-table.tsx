import { cn } from "cn";
import { InfoBadge } from "@/design-system/components/info-badge";
import { formatLineQuantity, groupByCategory } from "../lib/group-by-category";
import type { StockRequest } from "../types/stock-request.types";

// Vista de solo lectura del formato: por categoría, con lo pedido, enviado,
// recibido y la diferencia (DIF) de cada producto.
export function RequestLinesTable({ request }: { request: StockRequest }) {
  const groups = groupByCategory(request.lines);
  const showSent = request.status !== "SOLICITADA";
  const showReceived = request.status === "RECIBIDA";

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <section key={group.category} className="overflow-hidden rounded-xl border border-border">
          <h3 className="bg-muted/50 px-3 py-2 text-sm font-semibold text-foreground">{group.category}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">Producto</th>
                  <th className="px-2 py-1.5 text-right font-medium">Pedido</th>
                  {showSent && <th className="px-2 py-1.5 text-right font-medium">Enviado</th>}
                  {showReceived && <th className="px-2 py-1.5 text-right font-medium">Recibido</th>}
                  {showReceived && <th className="px-3 py-1.5 text-right font-medium">DIF</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {group.items.map((line) => {
                  const noStock = showSent && line.sentQuantity === 0;
                  const partial = showSent && !line.addedByPlant && line.sentQuantity !== null && line.sentQuantity > 0 && line.sentQuantity < line.requestedQuantity;
                  const notes = [line.plantNote ? `Planta: ${line.plantNote}` : null, line.storeNote ? `Tienda: ${line.storeNote}` : null].filter(Boolean);
                  return (
                    <tr key={line.productId} className={cn(noStock && "bg-destructive/5")}>
                      <td className="px-3 py-2 align-top">
                        <span className={cn("font-medium text-foreground", noStock && "line-through decoration-destructive/60")}>{line.productName}</span>
                        <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
                          {line.addedByPlant && <InfoBadge tone="violet" size="sm">Agregado por planta</InfoBadge>}
                          {noStock && <InfoBadge tone="danger" size="sm">No hay</InfoBadge>}
                          {partial && <InfoBadge tone="warning" size="sm">Parcial</InfoBadge>}
                        </span>
                        {notes.map((note) => (
                          <p key={note} className="text-xs text-muted-foreground">
                            {note}
                          </p>
                        ))}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums align-top text-muted-foreground">
                        {line.addedByPlant ? "—" : formatLineQuantity(line.requestedQuantity, line.unit)}
                      </td>
                      {showSent && (
                        <td className="px-2 py-2 text-right tabular-nums align-top">
                          {line.sentQuantity === null ? "—" : formatLineQuantity(line.sentQuantity, line.unit)}
                        </td>
                      )}
                      {showReceived && (
                        <td className="px-2 py-2 text-right tabular-nums align-top">
                          {line.receivedQuantity === null ? "—" : formatLineQuantity(line.receivedQuantity, line.unit)}
                        </td>
                      )}
                      {showReceived && (
                        <td
                          className={cn(
                            "px-3 py-2 text-right tabular-nums align-top",
                            line.difference ? "font-semibold text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {line.difference == null ? "—" : line.difference === 0 ? "0" : `${line.difference > 0 ? "+" : "-"}${formatLineQuantity(Math.abs(line.difference), line.unit)}`}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
