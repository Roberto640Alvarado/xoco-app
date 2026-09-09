"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
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

type Mode = "same" | "per-store";

// 0.08 -> "8", 0.085 -> "8.5". null (sin % guardado todavía) -> "".
function fractionToPercentInput(value: number | null): string {
  if (value == null) return "";
  return String(Math.round(value * 1000) / 10);
}

function percentInputToFraction(value: string): number {
  return Number(value) / 100;
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>% de crecimiento — {monthLabel}</DialogTitle>
          <DialogDescription>
            La meta de cada tienda se calcula como su total real de órdenes del mes anterior más
            este porcentaje.
          </DialogDescription>
        </DialogHeader>

        {upsert.isSuccess ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-3 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Guardado correctamente.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="same" />
                Mismo % para todas las tiendas
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="per-store" />
                % distinto por tienda
              </label>
            </RadioGroup>

            {mode === "same" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="same-growth">Crecimiento (%)</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="same-growth"
                    type="number"
                    step="0.1"
                    value={sameValue}
                    onChange={(e) => setSameValue(e.target.value)}
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.posConfigId} className="flex items-center justify-between gap-3">
                    <Label htmlFor={`growth-${item.posConfigId}`} className="text-sm font-normal">
                      {item.storeName}
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id={`growth-${item.posConfigId}`}
                        type="number"
                        step="0.1"
                        value={perStoreValues[item.posConfigId] ?? ""}
                        onChange={(e) =>
                          setPerStoreValues((prev) => ({ ...prev, [item.posConfigId]: e.target.value }))
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {upsert.isError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
