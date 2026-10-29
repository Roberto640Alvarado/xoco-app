"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CornerDownRight, MessageSquareText } from "lucide-react";
import { cn } from "cn";
import { formatLineQuantity, groupByCategory } from "../lib/group-by-category";
import { substitutesOf, withoutSubstitutes } from "../lib/substitution";
import type { StockRequestUnit } from "../types/stock-request.types";

export interface PreviewLine {
  productId: number;
  productName: string;
  categoryName: string;
  unit: StockRequestUnit;
  /** Lo que pidió la tienda (0 en agregados de planta). */
  requested: number;
  /** Lo que envía planta; null = sin responder. Se ignora en modo "request". */
  sent: number | null;
  note: string;
  added: boolean;
  replacesProductId: number | null;
}

interface RequestPreviewProps {
  lines: PreviewLine[];
  /** "request": lo que pide la tienda. "response": cómo le llega la respuesta de planta. */
  mode: "request" | "response";
  emptyText: string;
}

function responseLabel(line: PreviewLine, hasSubstitute: boolean): { text: string; tone: string } {
  if (line.sent === null) return { text: "Falta responder", tone: "text-amber-700 dark:text-amber-300" };
  if (line.added) return { text: `Va ${formatLineQuantity(line.sent, line.unit)}`, tone: "text-violet-700 dark:text-violet-300" };
  if (line.sent === 0) return { text: hasSubstitute ? "No hay · va otro" : "No hay", tone: "text-destructive" };
  if (line.sent < line.requested) return { text: `Van ${formatLineQuantity(line.sent, line.unit)} de ${formatLineQuantity(line.requested, line.unit)}`, tone: "text-sky-700 dark:text-sky-300" };
  return { text: `Va todo (${formatLineQuantity(line.sent, line.unit)})`, tone: "text-emerald-700 dark:text-emerald-300" };
}

/**
 * Contenido de la vista previa (va dentro de un PreviewSheet): el pedido o la
 * respuesta por categoría, tal como lo verá el otro lado. Los sustitutos de
 * planta salen anidados bajo el producto que reemplazan, y los comentarios
 * entre comillas a la par. Cada fila entra y sale con una animación corta.
 */
export function RequestPreview({ lines, mode, emptyText }: RequestPreviewProps) {
  const reduce = useReducedMotion() ?? false;
  const groups = groupByCategory(withoutSubstitutes(lines));

  if (groups.length === 0) {
    return <p className="flex h-full min-h-32 items-center justify-center text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  const rowMotion = reduce
    ? {}
    : {
        layout: true,
        initial: { opacity: 0, x: 16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -16 },
        transition: { duration: 0.2, ease: "easeOut" as const },
      };

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.category}>
          <p className="mb-1 border-b border-border pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{group.category}</p>
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {group.items.map((line) => {
                const subs = substitutesOf(line.productId, lines);
                const label = responseLabel(line, subs.length > 0);
                const crossed = mode === "response" && line.sent === 0;
                return (
                  <motion.li key={line.productId} {...rowMotion} className="flex flex-col gap-0.5 py-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className={cn("min-w-0 text-sm text-foreground", crossed && "text-muted-foreground line-through")}>{line.productName}</span>
                      {mode === "request" ? (
                        <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">{formatLineQuantity(line.requested, line.unit)}</span>
                      ) : (
                        <span className={cn("shrink-0 text-xs font-semibold", label.tone)}>{label.text}</span>
                      )}
                    </div>
                    {line.added && mode === "response" && <span className="text-[11px] text-violet-700 dark:text-violet-300">Extra: la tienda no lo pidió</span>}
                    {line.note.trim() && (
                      <span className="flex items-start gap-1 text-xs text-foreground/70 italic">
                        <MessageSquareText className="mt-0.5 size-3 shrink-0" aria-hidden="true" />“{line.note.trim()}”
                      </span>
                    )}
                    {subs.map((sub) => (
                      <motion.div
                        key={sub.productId}
                        {...rowMotion}
                        className="mt-1 ml-2 flex flex-col gap-0.5 rounded-lg border border-violet-500/30 bg-violet-500/5 px-2 py-1.5"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1 text-sm font-medium text-foreground">
                            <CornerDownRight className="size-3.5 shrink-0 text-violet-600" aria-hidden="true" />
                            {sub.productName}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-violet-700 dark:text-violet-300">
                            {sub.sent === null ? "Falta cantidad" : `Va ${formatLineQuantity(sub.sent, sub.unit)}`}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-300">
                          En lugar de {line.productName}
                          <ArrowRight className="size-3 rotate-180" aria-hidden="true" />
                        </span>
                        {sub.note.trim() && <span className="text-xs text-foreground/70 italic">“{sub.note.trim()}”</span>}
                      </motion.div>
                    ))}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      ))}
    </div>
  );
}
