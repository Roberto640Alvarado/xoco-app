"use client";

import { useId } from "react";
import { cn } from "cn";

interface CacaoLoaderProps {
  className?: string;
}

// Silueta de la mazorca de cacao (vertical, punta abajo) y sus surcos.
const POD = "M60 14 C80 21 88 42 88 62 C88 83 76 100 60 107 C44 100 32 83 32 62 C32 42 40 21 60 14 Z";
const RIDGES = [
  "M60 17 C61 45 61 80 60 104",
  "M50 19 C43 44 42 80 51 102",
  "M70 19 C77 44 78 80 69 102",
  "M41 27 C35 48 35 76 42 94",
  "M79 27 C85 48 85 76 78 94",
];
// Ola de chocolate: periodo de 60 unidades, para que el desplazamiento se repita sin salto.
const WAVE = "M-60 6 Q-45 0 -30 6 T0 6 T30 6 T60 6 T90 6 T120 6 T150 6 T180 6 V140 H-60 Z";

const STYLES = `
.cacao-level { animation: cacao-level 3.2s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
.cacao-wave { animation: cacao-wave 1.8s linear infinite; }
.cacao-pod { animation: cacao-breathe 3.2s ease-in-out infinite; transform-origin: 60px 60px; transform-box: view-box; }
@keyframes cacao-level {
  0% { transform: translateY(100px); }
  55%, 72% { transform: translateY(20px); }
  100% { transform: translateY(100px); }
}
@keyframes cacao-wave {
  from { transform: translateX(0); }
  to { transform: translateX(-60px); }
}
@keyframes cacao-breathe {
  0%, 100% { transform: scale(1); }
  60% { transform: scale(1.025); }
}
@media (prefers-reduced-motion: reduce) {
  .cacao-level, .cacao-wave, .cacao-pod { animation: none; }
  .cacao-level { transform: translateY(48px); }
}
`;

/**
 * Animación de carga del panel: una mazorca de cacao que se llena de
 * chocolate con una ola suave y se vacía, en bucle. Sobria, en los tonos del
 * chocolate (contorno más claro en modo oscuro). Con `prefers-reduced-motion`
 * queda quieta, a medio llenar. Base de `ChocolateLoader` y del inicio de sesión.
 */
export function CacaoLoader({ className }: CacaoLoaderProps) {
  const id = useId().replace(/:/g, "");
  const clipId = `cacao-clip-${id}`;
  const gradientId = `cacao-fill-${id}`;

  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("aspect-square w-24 text-[#6b4330] dark:text-[#c79a78]", className)}
      aria-hidden="true"
    >
      <style>{STYLES}</style>
      <defs>
        <clipPath id={clipId}>
          <path d={POD} />
        </clipPath>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5638" />
          <stop offset="100%" stopColor="#3f2418" />
        </linearGradient>
      </defs>

      <g className="cacao-pod">
        {/* Fondo de la mazorca */}
        <path d={POD} fill="currentColor" opacity="0.08" />

        {/* Chocolate que sube y baja dentro de la mazorca */}
        <g clipPath={`url(#${clipId})`}>
          <g className="cacao-level">
            <path className="cacao-wave" d={WAVE} fill={`url(#${gradientId})`} />
          </g>
        </g>

        {/* Surcos y contorno */}
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          {RIDGES.map((ridge) => (
            <path key={ridge} d={ridge} strokeWidth="1.4" opacity="0.35" />
          ))}
          <path d={POD} strokeWidth="2.6" strokeLinejoin="round" />
          {/* Tallo */}
          <path d="M60 14 C60 9 62 6 66 4" strokeWidth="2.6" />
        </g>

        {/* Brillo */}
        <path d="M43 34 C39 44 38 56 39 66" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.35" />
      </g>
    </svg>
  );
}
