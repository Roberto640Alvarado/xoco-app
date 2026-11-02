"use client";

import type { ReactNode } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Ícono opcional antes del texto (ej. el logo de una marca). */
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nombre del grupo para lectores de pantalla (ej. "Medir por"). */
  ariaLabel: string;
  className?: string;
}

/**
 * Selector de 2-3 opciones excluyentes en una sola pastilla (ej. "Por
 * dinero" / "Por unidad"). La opción activa usa el botón `default`; el resto,
 * `ghost`. Para más opciones, un Select.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, className }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("inline-flex items-center gap-0.5 rounded-lg border border-border p-0.5", className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "ghost"}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn("h-7 px-3", option.icon && "gap-1.5", value !== option.value && "text-muted-foreground")}
        >
          {option.icon}
          {option.label}
        </Button>
      ))}
    </div>
  );
}
