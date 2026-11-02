import { cn } from "cn";
import { ChocolateWalker } from "./chocolate-walker";

type ChocolateLoaderSize = "sm" | "md" | "lg";

const SIZE: Record<ChocolateLoaderSize, string> = {
  sm: "w-14",
  md: "w-24",
  lg: "w-32",
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
 * Animación de carga del panel: "Xoco caminando", la tableta de chocolate con
 * el logo de Xocolatísimo (ver ChocolateWalker). Respeta
 * `prefers-reduced-motion` (queda quieta).
 */
export function ChocolateLoader({ label = "Cargando...", size = "md", delayed = false, className }: ChocolateLoaderProps) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center gap-2", delayed && "choco-fade-in", className)}>
      <ChocolateWalker className={SIZE[size]} />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : <span className="sr-only">Cargando...</span>}
    </div>
  );
}
