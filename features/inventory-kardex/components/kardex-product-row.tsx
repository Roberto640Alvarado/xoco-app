"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { formatDateTime } from "@/lib/format";
import { formatKardexQuantity, formatSigned, TYPE_TONE } from "../lib/kardex-format";
import type { KardexProduct } from "../types/inventory-kardex.types";

/** Mismas columnas para el encabezado y cada fila (md+). */
export const KARDEX_GRID = "md:grid md:grid-cols-[minmax(0,1fr)_repeat(5,minmax(4.5rem,6.5rem))_2.25rem] md:items-center md:gap-x-2";

const TONE = {
  in: "text-emerald-700 dark:text-emerald-300",
  out: "text-destructive",
  adjust: "text-sky-700 dark:text-sky-300",
};

interface CellProps {
  label: string;
  value: string;
  className?: string;
}

// En escritorio es una celda alineada a la derecha; en móvil, una cajita con su etiqueta.
function Cell({ label, value, className }: CellProps) {
  return (
    <div className="flex flex-col rounded-lg bg-muted/50 px-2.5 py-1.5 md:bg-transparent md:p-0 md:text-right">
      <span className="text-[11px] text-muted-foreground md:hidden">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", className)}>{value}</span>
    </div>
  );
}

interface KardexProductRowProps {
  product: KardexProduct;
  open: boolean;
  onToggle: () => void;
  /** false cuando NINGÚN producto tiene conteo: el aviso de arriba ya lo dice. */
  showNoCountBadge?: boolean;
}

/**
 * Una fila del Kardex: el producto con su saldo inicial, lo que entró, salió
 * y se ajustó, y su saldo final. Al tocarla se despliega debajo su kardex
 * línea por línea. En móvil la fila se vuelve tarjeta con las cifras en
 * cajitas etiquetadas.
 */
export function KardexProductRow({ product, open, onToggle, showNoCountBadge = true }: KardexProductRowProps) {
  const reduce = useReducedMotion() ?? false;
  const unit = product.unit;
  const hasRows = product.rows.length > 0;
  const noCount = product.closingBalance === null;

  return (
    <div className={cn("border-b border-border last:border-b-0", open && "bg-muted/30")}>
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasRows}
        aria-expanded={hasRows ? open : undefined}
        className={cn(
          "flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors",
          KARDEX_GRID,
          hasRows ? "hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none" : "cursor-default",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground" title={product.productName}>
              {product.productName}
            </span>
            <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {unit === "kg" ? "Por kg" : "Por pieza"}
              {noCount && showNoCountBadge && <span className="rounded-full bg-amber-500/15 px-1.5 font-medium text-amber-700 dark:text-amber-300">Sin conteo</span>}
              {!hasRows && <span>· sin movimientos</span>}
            </span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 md:contents">
          <Cell label="Inicial" value={formatKardexQuantity(product.openingBalance, unit)} className="text-muted-foreground" />
          <Cell label="Entró" value={product.totalIn ? `+${formatKardexQuantity(product.totalIn, unit)}` : "0"} className={product.totalIn ? TONE.in : "text-muted-foreground"} />
          <Cell label="Salió" value={product.totalOut ? `−${formatKardexQuantity(product.totalOut, unit)}` : "0"} className={product.totalOut ? TONE.out : "text-muted-foreground"} />
          <Cell label="Ajuste" value={formatSigned(product.totalAdjustment, unit)} className={product.totalAdjustment ? TONE.adjust : "text-muted-foreground"} />
          <Cell label="Final" value={formatKardexQuantity(product.closingBalance, unit)} className="text-base font-bold text-foreground" />
          <span className="hidden md:flex md:justify-end">
            {hasRows && <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />}
          </span>
        </div>
        {hasRows && (
          <span className="text-xs font-medium text-primary md:hidden">{open ? "Ocultar movimientos" : `Ver ${product.rows.length} movimiento${product.rows.length === 1 ? "" : "s"}`}</span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && hasRows && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {/* Tabla (md+) */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60 text-[11px] text-muted-foreground uppercase">
                        <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                        <th className="px-2 py-2 text-left font-semibold">Qué pasó</th>
                        <th className="px-2 py-2 text-left font-semibold">Detalle</th>
                        <th className="px-2 py-2 text-right font-semibold">Entró</th>
                        <th className="px-2 py-2 text-right font-semibold">Salió</th>
                        <th className="px-2 py-2 text-right font-semibold">Ajuste</th>
                        <th className="px-3 py-2 text-right font-semibold">Queda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="bg-muted/20 text-muted-foreground">
                        <td className="px-3 py-2" colSpan={6}>
                          Saldo al iniciar el período
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-foreground">{formatKardexQuantity(product.openingBalance, unit)}</td>
                      </tr>
                      {product.rows.map((row, index) => (
                        <tr key={`${row.occurredAt}-${index}`}>
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatDateTime(row.occurredAt)}</td>
                          <td className={cn("px-2 py-2 font-medium whitespace-nowrap", TYPE_TONE[row.type])}>{row.concept}</td>
                          <td className="px-2 py-2 text-xs text-muted-foreground">
                            {row.reference}
                            {row.registeredBy && <span className="block">{row.registeredBy}</span>}
                          </td>
                          <td className={cn("px-2 py-2 text-right tabular-nums", TONE.in)}>{row.quantityIn ? `+${formatKardexQuantity(row.quantityIn, unit)}` : ""}</td>
                          <td className={cn("px-2 py-2 text-right tabular-nums", TONE.out)}>{row.quantityOut ? `−${formatKardexQuantity(row.quantityOut, unit)}` : ""}</td>
                          <td className={cn("px-2 py-2 text-right tabular-nums", TONE.adjust)}>{row.type === "CONTEO" ? formatSigned(row.adjustment, unit) : ""}</td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatKardexQuantity(row.balance, unit)}</td>
                        </tr>
                      ))}
                      <tr className="bg-primary/5 font-semibold">
                        <td className="px-3 py-2" colSpan={6}>
                          Saldo al cerrar el período
                        </td>
                        <td className="px-3 py-2 text-right text-base font-bold tabular-nums">{formatKardexQuantity(product.closingBalance, unit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Lista (móvil) */}
                <ul className="divide-y divide-border md:hidden">
                  {product.rows.map((row, index) => (
                    <li key={`${row.occurredAt}-${index}`} className="flex items-start justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium", TYPE_TONE[row.type])}>{row.concept}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(row.occurredAt)}</p>
                        {row.reference && <p className="text-xs break-words text-muted-foreground">{row.reference}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {row.quantityIn
                            ? `+${formatKardexQuantity(row.quantityIn, unit)}`
                            : row.quantityOut
                              ? `−${formatKardexQuantity(row.quantityOut, unit)}`
                              : formatSigned(row.adjustment, unit)}
                        </p>
                        <p className="text-xs text-muted-foreground">Queda {formatKardexQuantity(row.balance, unit)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
