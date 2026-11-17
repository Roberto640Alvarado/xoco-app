"use client";

import { useId } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";
import { Label } from "@/components/ui/label";

interface ThemeSwitchProps {
  /** true = claro (se ve el sol), false = oscuro (se ve la luna). */
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

const EASE = "duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

/**
 * Interruptor claro/oscuro con sol y luna: una pastilla con un "pulgar" que
 * se desliza de mitad a mitad y el ícono del modo actual del otro lado.
 * Adaptado de un switch de origin-ui a Base UI (el Switch del proyecto usa
 * `data-checked` / `data-unchecked` en vez de `data-[state=…]` de Radix).
 */
export function ThemeSwitch({ checked, onCheckedChange, disabled, label = "Cambiar entre modo claro y oscuro", className }: ThemeSwitchProps) {
  const id = useId();

  return (
    <div className={cn(disabled && "opacity-60", className)}>
      <div className="relative inline-grid h-9 grid-cols-[1fr_1fr] items-center text-sm font-medium">
        <SwitchPrimitive.Root
          id={id}
          checked={checked}
          onCheckedChange={(next) => onCheckedChange(next)}
          disabled={disabled}
          className={cn(
            "peer absolute inset-0 inline-flex h-[inherit] w-auto cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors",
            "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
            "data-checked:bg-primary data-unchecked:bg-input/50",
          )}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              "pointer-events-none z-10 block h-full w-1/2 rounded-full bg-background shadow-sm ring-0 transition-transform",
              EASE,
              "data-checked:translate-x-full rtl:data-checked:-translate-x-full",
            )}
          />
        </SwitchPrimitive.Root>
        <span
          className={cn(
            "pointer-events-none relative ms-0.5 flex min-w-8 items-center justify-center text-center transition-transform",
            EASE,
            "peer-data-checked:invisible peer-data-unchecked:translate-x-full rtl:peer-data-unchecked:-translate-x-full",
          )}
        >
          <MoonIcon aria-hidden="true" size={16} />
        </span>
        <span
          className={cn(
            "pointer-events-none relative me-0.5 flex min-w-8 items-center justify-center text-center transition-transform",
            EASE,
            "peer-data-checked:-translate-x-full peer-data-checked:text-background peer-data-unchecked:invisible rtl:peer-data-checked:translate-x-full",
          )}
        >
          <SunIcon aria-hidden="true" size={16} />
        </span>
      </div>
      <Label className="sr-only" htmlFor={id}>
        {label}
      </Label>
    </div>
  );
}
