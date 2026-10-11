import type { CSSProperties } from "react";
import { cn } from "cn";

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

// Posición de cada cuadro de la barra: 3 columnas x 2 filas.
const SQUARES = [0, 1, 2, 3, 4, 5].map((index) => ({
  index,
  x: 23 + (index % 3) * 26,
  y: 21 + Math.floor(index / 3) * 23,
}));

/**
 * Animación de carga con tema de chocolate: una barra cuyos cuadros van
 * apareciendo en ola, con un destello que la cruza y gotas de chocolate que
 * caen sobre un charco. Respeta `prefers-reduced-motion` (queda quieta). Los
 * keyframes viven en app/globals.css (clases `choco-*`).
 */
export function ChocolateLoader({ label = "Cargando...", size = "md", delayed = false, className }: ChocolateLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("choco-loader flex flex-col items-center gap-2", delayed && "choco-fade-in", className)}
    >
      <svg viewBox="0 0 120 104" className={cn("h-auto", SIZE[size])} aria-hidden="true">
        <defs>
          <linearGradient id="choco-square" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--choco-3)" />
            <stop offset="1" stopColor="var(--choco-2)" />
          </linearGradient>
          <linearGradient id="choco-gloss" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="choco-bar-clip">
            <rect x="20" y="18" width="80" height="48" rx="9" />
          </clipPath>
        </defs>

        {/* Charco */}
        <ellipse cx="60" cy="96" rx="30" ry="4.5" fill="var(--choco-2)" opacity="0.4" />
        <ellipse className="choco-ripple" cx="60" cy="96" rx="30" ry="4.5" fill="none" stroke="var(--choco-hi)" strokeWidth="1.2" />

        {/* Gotas */}
        <path className="choco-hang" style={{ "--d": "0s" } as CSSProperties} d="M41 65h6v4a3 3 0 0 1-6 0z" fill="var(--choco-1)" />
        <path className="choco-hang" style={{ "--d": "0.5s" } as CSSProperties} d="M73 65h6v4a3 3 0 0 1-6 0z" fill="var(--choco-1)" />
        <path className="choco-drop" style={{ "--d": "0s" } as CSSProperties} d="M44 66c2 3 3 5 3 6.6a3 3 0 0 1-6 0c0-1.6 1-3.6 3-6.6z" fill="var(--choco-2)" />
        <path className="choco-drop" style={{ "--d": "0.5s" } as CSSProperties} d="M76 66c2 3 3 5 3 6.6a3 3 0 0 1-6 0c0-1.6 1-3.6 3-6.6z" fill="var(--choco-2)" />

        {/* Barra */}
        <rect x="20" y="18" width="80" height="48" rx="9" fill="var(--choco-1)" />
        {SQUARES.map((square) => (
          <g key={square.index} className="choco-square" style={{ "--i": square.index } as CSSProperties}>
            <rect x={square.x} y={square.y} width="22" height="19" rx="4" fill="url(#choco-square)" />
            <rect x={square.x + 2.5} y={square.y + 2} width="10" height="2.2" rx="1.1" fill="var(--choco-hi)" opacity="0.55" />
          </g>
        ))}

        {/* Destello */}
        <g clipPath="url(#choco-bar-clip)">
          <g transform="skewX(-18)">
            <rect className="choco-shine" x="10" y="12" width="26" height="60" fill="url(#choco-gloss)" />
          </g>
        </g>
      </svg>
      {label ? (
        <p className="text-sm text-muted-foreground">{label}</p>
      ) : (
        <span className="sr-only">Cargando...</span>
      )}
    </div>
  );
}
