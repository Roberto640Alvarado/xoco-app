import { cn } from "cn";
import { ChocolateBarLoader } from "./chocolate-bar-loader";

type ChocolateLoaderSize = "sm" | "md" | "lg";

const SIZE: Record<ChocolateLoaderSize, string> = {
  sm: "w-9",
  md: "w-14",
  lg: "w-20",
};

interface ChocolateLoaderProps {
  /** Texto bajo la animación. Sin texto queda solo para lectores de pantalla. */
  label?: string;
  size?: ChocolateLoaderSize;
  /** Aparece con un pequeño retraso (evita el parpadeo en cargas rápidas). */
  delayed?: boolean;
  className?: string;
}

/**
 * Animación de carga del panel: la tableta de Xocolatísimo con su envoltura
 * de mazorcas de cacao (ver ChocolateBarLoader). Respeta `prefers-reduced-motion` (queda quieta).
 */
export function ChocolateLoader({ label = "Cargando...", size = "md", delayed = false, className }: ChocolateLoaderProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-2", delayed && "choco-fade-in", className)}>
      <ChocolateBarLoader className={SIZE[size]} />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : <span className="sr-only">Cargando...</span>}
    </div>
  );
}
