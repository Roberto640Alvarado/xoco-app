import { cn } from "cn";

interface ValueBoxProps {
  /** Valor a mostrar; null = todavía sin dato ("—"). */
  value: string | null;
  className?: string;
  "aria-label"?: string;
}

/** Caja de solo lectura (ej. "Existencia estimada" de Conteo): borde y fondo
 * visibles, valor en negrita, alineado a la derecha como el input editable
 * que va a su lado. */
export function ValueBox({ value, className, "aria-label": ariaLabel }: ValueBoxProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "flex h-9 w-20 items-center justify-end rounded-md border border-border bg-muted px-2.5 text-sm tabular-nums",
        value != null ? "font-semibold text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {value ?? "—"}
    </div>
  );
}
