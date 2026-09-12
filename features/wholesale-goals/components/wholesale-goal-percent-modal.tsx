"use client";

import { useState } from "react";
import { CheckCircle2, DollarSign, Loader2 } from "lucide-react";
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
import { useUpsertWholesaleGoalsBulk } from "../hooks/use-upsert-wholesale-goals-bulk";
import type { WholesaleGoalSummaryItem } from "../types/wholesale-goals.types";

type Mode = "same" | "per-client";

// 0.08 -> "8", 0.085 -> "8.5". null (sin % guardado todavía) -> "".
function fractionToPercentInput(value: number | null): string {
  if (value == null) return "";
  return String(Math.round(value * 1000) / 10);
}

function percentInputToFraction(value: string): number {
  return Number(value) / 100;
}

// Mismo recurso visual que PercentInput de sales-goal-percent-modal.tsx
// (el símbolo "%" fijo dentro del input, a la derecha) — no se compartió
// un componente porque cada módulo tiene el suyo.
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

interface WholesaleGoalPercentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  monthLabel: string;
  items: WholesaleGoalSummaryItem[];
}

// Modal de "Configurar % de crecimiento" de Ventas Mayoreo — mismo patrón
// que SalesGoalPercentModal (features/sales-goals/), pero con
// `clientKey` (string) en vez de `posConfigId` y su propio % guardado
// (no comparte metas con Venta Mensual).
export function WholesaleGoalPercentModal({
  open,
  onOpenChange,
  year,
  month,
  monthLabel,
  items,
}: WholesaleGoalPercentModalProps) {
  const upsert = useUpsertWholesaleGoalsBulk();
  const [mode, setMode] = useState<Mode>("same");
  const [sameValue, setSameValue] = useState("8");
  const [perClientValues, setPerClientValues] = useState<Record<string, string>>({});

  // Precarga con lo ya guardado justo al ABRIRSE — ajuste de estado
  // durante el render (no en un useEffect), mismo patrón que
  // SalesGoalPercentModal.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);

    const values = items.map((item) => item.growthPercent);
    const uniqueValues = new Set(values.filter((v): v is number => v != null));
    const allSameOrUnset = uniqueValues.size <= 1;

    setMode(allSameOrUnset ? "same" : "per-client");
    setSameValue(fractionToPercentInput(uniqueValues.size === 1 ? [...uniqueValues][0] : 0.08));
    setPerClientValues(
      Object.fromEntries(items.map((item) => [item.clientKey, fractionToPercentInput(item.growthPercent)])),
    );
    upsert.reset();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function handleSubmit() {
    const entries =
      mode === "same"
        ? items.map((item) => ({
            clientKey: item.clientKey,
            growthPercent: percentInputToFraction(sameValue),
          }))
        : items.map((item) => ({
            clientKey: item.clientKey,
            growthPercent: percentInputToFraction(perClientValues[item.clientKey] ?? "0"),
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
          const value = perClientValues[item.clientKey];
          return value !== undefined && value !== "" && !Number.isNaN(Number(value));
        });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <DialogTitle className="text-lg font-bold text-foreground">
                % de crecimiento de mayoreo
              </DialogTitle>
              <p className="text-sm font-medium text-primary capitalize">{monthLabel}</p>
            </div>
          </div>
          <DialogDescription className="pt-1 leading-relaxed">
            La <span className="font-medium text-foreground">meta</span> de cada cliente de mayoreo se
            calcula sobre la meta del mes anterior, más el porcentaje que definas aquí. Es un % propio
            de Ventas Mayoreo, independiente del de Venta Mensual.
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
                  <p className="text-sm font-medium text-foreground">Mismo % para todos los clientes</p>
                  <p className="text-xs text-muted-foreground">
                    Un solo porcentaje aplicado a los {items.length} clientes de mayoreo.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  mode === "per-client"
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-border/80 hover:bg-muted/40",
                )}
              >
                <RadioGroupItem value="per-client" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">% distinto por cliente</p>
                  <p className="text-xs text-muted-foreground">
                    Define un porcentaje independiente para cada cliente.
                  </p>
                </div>
              </label>
            </RadioGroup>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              {mode === "same" ? (
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="same-wholesale-growth" className="text-sm font-medium text-foreground">
                    Crecimiento
                  </Label>
                  <PercentInput id="same-wholesale-growth" value={sameValue} onChange={setSameValue} className="w-28" />
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.clientKey} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <Label htmlFor={`wholesale-growth-${item.clientKey}`} className="text-sm font-normal text-foreground">
                        {item.clientLabel}
                      </Label>
                      <PercentInput
                        id={`wholesale-growth-${item.clientKey}`}
                        value={perClientValues[item.clientKey] ?? ""}
                        onChange={(value) =>
                          setPerClientValues((prev) => ({ ...prev, [item.clientKey]: value }))
                        }
                        className="w-24"
                      />
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
