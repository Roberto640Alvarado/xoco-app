"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import { cn } from "cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpsertGoalsBulk } from "../hooks/use-upsert-goals-bulk";
import type { GoalSummaryItem } from "../types/goals.types";

import { LastModifiedNote } from "@/components/ui/last-modified-note";

type Mode = "same" | "per-store";

// 0.08 -> "8", 0.085 -> "8.5". null (sin % guardado todavía) -> "".
function fractionToPercentInput(value: number | null): string {
  if (value == null) return "";
  return String(Math.round(value * 1000) / 10);
}

function percentInputToFraction(value: string): number {
  return Number(value) / 100;
}

// Input numérico con el símbolo "%" fijo dentro, a la derecha (mismo
// recurso visual que el ojo de PasswordInput: un ícono/símbolo absoluto
// dentro de un wrapper relative).
function PercentInput({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-7 text-right tabular-nums"
      />
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground">
        %
      </span>
    </div>
  );
}

interface GrowthPercentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  monthLabel: string;
  items: GoalSummaryItem[];
}

// Modal de "Configurar % de crecimiento": pedido explícito del usuario —
// cada mes se puede elegir aplicar el mismo % a todas las tiendas o uno
// distinto por tienda. Guarda con PUT /goals (lote) y muestra una
// confirmación visible antes de cerrarse solo, para que "se note" que
// quedó guardado.
export function GrowthPercentModal({
  open,
  onOpenChange,
  year,
  month,
  monthLabel,
  items,
}: GrowthPercentModalProps) {
  const upsert = useUpsertGoalsBulk();
  const [mode, setMode] = useState<Mode>("same");
  const [sameValue, setSameValue] = useState("8");
  const [perStoreValues, setPerStoreValues] = useState<Record<number, string>>({});

  // Precarga con lo que ya esté guardado justo al ABRIRSE (no en cada
  // render mientras está abierto) — se ajusta el estado durante el
  // render, en vez de en un useEffect, siguiendo el patrón recomendado
  // por React para "resetear estado cuando cambia una prop" sin disparar
  // un render en cascada. Si todas las tiendas comparten el mismo % (o
  // ninguna tiene todavía), arranca en modo "mismo para todas"; si hay
  // valores distintos entre tiendas, arranca en "% distinto por tienda"
  // para no perder esa diferencia.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);

    const values = items.map((item) => item.growthPercent);
    const uniqueValues = new Set(values.filter((v): v is number => v != null));
    const allSameOrUnset = uniqueValues.size <= 1;

    setMode(allSameOrUnset ? "same" : "per-store");
    setSameValue(fractionToPercentInput(uniqueValues.size === 1 ? [...uniqueValues][0] : 0.08));
    setPerStoreValues(
      Object.fromEntries(items.map((item) => [item.posConfigId, fractionToPercentInput(item.growthPercent)])),
    );
    upsert.reset();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const mostRecentAudit = useMemo(() => {
    let best: { updatedAt: string; updatedByEmail: string | null } | null = null;
    for (const item of items) {
      if (!item.updatedAt) continue;
      if (!best || new Date(item.updatedAt) > new Date(best.updatedAt)) {
        best = { updatedAt: item.updatedAt, updatedByEmail: item.updatedByEmail };
      }
    }
    return best;
  }, [items]);

  function handleSubmit() {
    const entries =
      mode === "same"
        ? items.map((item) => ({
            posConfigId: item.posConfigId,
            growthPercent: percentInputToFraction(sameValue),
          }))
        : items.map((item) => ({
            posConfigId: item.posConfigId,
            growthPercent: percentInputToFraction(perStoreValues[item.posConfigId] ?? "0"),
          }));

    upsert.mutate(
      { year, month, entries },
      { onSuccess: () => setTimeout(() => onOpenChange(false), 1200) },
    );
  }

  const isValid =
    mode === "same"
      ? sameValue !== "" && !Number.isNaN(Number(sameValue))
      : items.every((item) => {
          const value = perStoreValues[item.posConfigId];
          return value !== undefined && value !== "" && !Number.isNaN(Number(value));
        });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <DialogTitle className="text-lg font-bold text-foreground">
                % de crecimiento mensual
              </DialogTitle>
              <p className="text-sm font-medium text-primary capitalize">{monthLabel}</p>
            </div>
          </div>
          <DialogDescription className="pt-1 leading-relaxed">
            La <span className="font-medium text-foreground">meta</span> de cada tienda se calcula
            como su total real de órdenes del mes anterior, más el porcentaje que definas aquí.
          </DialogDescription>
        </DialogHeader>

        {upsert.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            % de crecimiento guardado correctamente.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as Mode)} className="gap-2.5">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  mode === "same"
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-border/80 hover:bg-muted/40",
                )}
              >
                <RadioGroupItem value="same" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Mismo % para todas las tiendas</p>
                  <p className="text-xs text-muted-foreground">
                    Un solo porcentaje aplicado a las {items.length} tiendas activas.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  mode === "per-store"
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-border/80 hover:bg-muted/40",
                )}
              >
                <RadioGroupItem value="per-store" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">% distinto por tienda</p>
                  <p className="text-xs text-muted-foreground">
                    Define un porcentaje independiente para cada tienda.
                  </p>
                </div>
              </label>
            </RadioGroup>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              {mode === "same" ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="same-growth" className="text-sm font-medium text-foreground">
                      Crecimiento
                    </Label>
                    <PercentInput id="same-growth" value={sameValue} onChange={setSameValue} className="w-28" />
                  </div>
                  <LastModifiedNote
                    email={mostRecentAudit?.updatedByEmail ?? null}
                    date={mostRecentAudit?.updatedAt ?? null}
                  />
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.posConfigId} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor={`growth-${item.posConfigId}`} className="text-sm font-normal text-foreground">
                          {item.storeName}
                        </Label>
                        <PercentInput
                          id={`growth-${item.posConfigId}`}
                          value={perStoreValues[item.posConfigId] ?? ""}
                          onChange={(value) =>
                            setPerStoreValues((prev) => ({ ...prev, [item.posConfigId]: value }))
                          }
                          className="w-24"
                        />
                      </div>
                      <LastModifiedNote email={item.updatedByEmail} date={item.updatedAt} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {upsert.isError && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {upsert.error.message}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={upsert.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || upsert.isPending || upsert.isSuccess}
          >
            {upsert.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : upsert.isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Guardado
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
