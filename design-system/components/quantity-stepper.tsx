"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "cn";

interface QuantityStepperProps {
  /** null = sin responder: el campo se ve vacío y el primer "+" lo lleva a `step`. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** 1 para piezas, 0.5 o 0.1 para kg. */
  step?: number;
  min?: number;
  max?: number;
  /** Texto corto tras el número (ej. "kg"). */
  suffix?: string;
  disabled?: boolean;
  /** Nombre para lectores de pantalla (ej. "Cantidad de Brownie"). */
  ariaLabel: string;
  className?: string;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Cantidad con botones − / + y campo editable. Pensado para móvil: botones
 * grandes y `inputMode="decimal"`. No deja bajar de `min` (0 por defecto).
 */
export function QuantityStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  suffix,
  disabled = false,
  ariaLabel,
  className,
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max ?? Infinity, Math.max(min, round(next)));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-background",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Quitar ${step} a ${ariaLabel}`}
        disabled={disabled || value == null || value <= min}
        onClick={() => onChange(clamp((value ?? 0) - step))}
        className="flex size-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="decimal"
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder="—"
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") return onChange(null);
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) onChange(clamp(parsed));
        }}
        className="h-8 w-14 border-x border-border bg-transparent text-center text-sm tabular-nums outline-none [appearance:textfield] focus-visible:bg-muted/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="pl-1.5 text-xs text-muted-foreground">{suffix}</span>}
      <button
        type="button"
        aria-label={`Agregar ${step} a ${ariaLabel}`}
        disabled={disabled || (max != null && value != null && value >= max)}
        onClick={() => onChange(clamp((value ?? 0) + step))}
        className="flex size-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
