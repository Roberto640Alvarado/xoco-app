"use client";

import { useId, type CSSProperties } from "react";
import { cn } from "cn";
import { XocolatisimoMark } from "@/components/brand/xocolatisimo-mark";

interface ChocolateBarLoaderProps {
  className?: string;
}

type PodKind = "yellow" | "green" | "outline" | "red";

// Patrón de la envoltura de las tabletas de Xocolatísimo: mazorcas de cacao
// amarillas, verdes y en línea, y cortes rojos, alrededor del sello y de la
// etiqueta negra. Coordenadas en el viewBox 60 x 100 de la tableta; las de
// la orilla se recortan como en el empaque. Se encienden en este orden.
const PODS: { x: number; y: number; rotate: number; kind: PodKind }[] = [
  { x: 3, y: 4.0, rotate: -25, kind: "yellow" },
  { x: 18, y: 4.0, rotate: 65, kind: "outline" },
  { x: 33, y: 4.0, rotate: 65, kind: "green" },
  { x: 48, y: 4.0, rotate: -25, kind: "red" },
  { x: 63, y: 4.0, rotate: 25, kind: "green" },
  { x: -4.5, y: 14.6, rotate: 65, kind: "yellow" },
  { x: 10.5, y: 14.6, rotate: 40, kind: "outline" },
  { x: 25.5, y: 14.6, rotate: 115, kind: "red" },
  { x: 40.5, y: 14.6, rotate: 65, kind: "yellow" },
  { x: 55.5, y: 14.6, rotate: -40, kind: "outline" },
  { x: 3, y: 25.2, rotate: 65, kind: "green" },
  { x: 48, y: 25.2, rotate: -40, kind: "outline" },
  { x: 63, y: 25.2, rotate: 40, kind: "yellow" },
  { x: -4.5, y: 35.8, rotate: 25, kind: "outline" },
  { x: 10.5, y: 35.8, rotate: 65, kind: "green" },
  { x: 55.5, y: 35.8, rotate: -25, kind: "red" },
  { x: 3, y: 46.4, rotate: -25, kind: "green" },
  { x: 18, y: 46.4, rotate: 115, kind: "yellow" },
  { x: 48, y: 46.4, rotate: 40, kind: "outline" },
  { x: 63, y: 46.4, rotate: 65, kind: "red" },
  { x: -4.5, y: 57.0, rotate: 65, kind: "yellow" },
  { x: 55.5, y: 57.0, rotate: 40, kind: "outline" },
  { x: 3, y: 67.6, rotate: 40, kind: "green" },
  { x: 63, y: 67.6, rotate: 115, kind: "outline" },
  { x: -4.5, y: 78.2, rotate: -25, kind: "yellow" },
  { x: 55.5, y: 78.2, rotate: -25, kind: "outline" },
  { x: 3, y: 88.8, rotate: 115, kind: "green" },
  { x: 18, y: 88.8, rotate: -25, kind: "red" },
  { x: 33, y: 88.8, rotate: 65, kind: "green" },
  { x: 48, y: 88.8, rotate: 40, kind: "yellow" },
  { x: 63, y: 88.8, rotate: 115, kind: "outline" },
  { x: -4.5, y: 99.4, rotate: -40, kind: "red" },
  { x: 10.5, y: 99.4, rotate: 115, kind: "yellow" },
  { x: 25.5, y: 99.4, rotate: -40, kind: "outline" },
  { x: 40.5, y: 99.4, rotate: -25, kind: "green" },
  { x: 55.5, y: 99.4, rotate: 65, kind: "outline" },
];

const POD_FILL: Record<Exclude<PodKind, "red">, string> = {
  yellow: "#e6c25b",
  green: "#3f6b38",
  outline: "#ffffff",
};
const INK = "#2b1a14";
const GOLD = "#8a5a2b";
const POD_SHAPE = "M0 -7 C3.6 -5 3.6 5 0 7 C-3.6 5 -3.6 -5 0 -7 Z";
const POD_RIDGES = "M0 -5.5 V5.5 M-1.8 -4 C-2.4 -1 -2.4 1 -1.8 4 M1.8 -4 C2.4 -1 2.4 1 1.8 4";
// Círculo del sello (radio 10.5 alrededor de 30,34) para el texto "XOCOLATÍSIMO".
const RING = "M19.5 34 A10.5 10.5 0 1 1 40.5 34 A10.5 10.5 0 1 1 19.5 34";

const STYLES = `
.xoco-bar-pod { opacity: 0.12; animation: xoco-bar-pod 3s ease-in-out infinite; animation-delay: calc(var(--i) * 0.05s); }
.xoco-bar-ring { transform-box: view-box; transform-origin: 30px 34px; animation: xoco-bar-ring 12s linear infinite; }
@keyframes xoco-bar-pod {
  0%, 6% { opacity: 0.12; }
  22%, 64% { opacity: 1; }
  84%, 100% { opacity: 0.12; }
}
@keyframes xoco-bar-ring { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .xoco-bar-pod, .xoco-bar-ring { animation: none; }
  .xoco-bar-pod { opacity: 1; }
}
`;

/**
 * Animación de carga del panel: la tableta de Xocolatísimo como es su
 * empaque, envoltura blanca con mazorcas de cacao (amarillas, verdes, en
 * línea y cortes rojos), el sello redondo con el logo y "XOCOLATÍSIMO" en
 * anillo, y la etiqueta negra "CHOCOLATE · OSCURO / DARK · 85%". Las
 * mazorcas se van dibujando una tras otra y se desvanecen, en bucle de 3 s,
 * mientras el anillo del sello gira despacio. Con `prefers-reduced-motion`
 * queda quieta y completa. Base de `ChocolateLoader` y del inicio de sesión.
 */
export function ChocolateBarLoader({ className }: ChocolateBarLoaderProps) {
  const id = useId().replace(/:/g, "");
  const clipId = `xoco-bar-clip-${id}`;
  const ringId = `xoco-bar-ring-${id}`;

  return (
    <div className={cn("relative aspect-[60/100] w-16 drop-shadow-sm", className)} aria-hidden="true">
      <svg viewBox="0 0 60 100" className="absolute inset-0 h-full w-full">
        <style>{STYLES}</style>
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="60" height="100" rx="2.5" />
          </clipPath>
          <path id={ringId} d={RING} />
        </defs>

        {/* Envoltura */}
        <rect x="0.3" y="0.3" width="59.4" height="99.4" rx="2.5" fill="#fff" stroke="#e4e4e7" strokeWidth="0.6" />

        {/* Mazorcas de cacao */}
        <g clipPath={`url(#${clipId})`}>
          {PODS.map((pod, index) => (
            <g key={index} className="xoco-bar-pod" style={{ "--i": index } as CSSProperties}>
              {pod.kind === "red" ? (
                <g transform={`translate(${pod.x} ${pod.y})`}>
                  <circle r="3.3" fill="#c8402f" stroke={INK} strokeWidth="0.5" />
                  <circle r="1.5" fill="none" stroke="#f3d9c4" strokeWidth="0.6" />
                </g>
              ) : (
                <g transform={`translate(${pod.x} ${pod.y}) rotate(${pod.rotate}) scale(0.8)`}>
                  <path d={POD_SHAPE} fill={POD_FILL[pod.kind]} stroke={INK} strokeWidth="0.75" />
                  <path d={POD_RIDGES} fill="none" stroke={INK} strokeWidth="0.4" opacity="0.7" />
                </g>
              )}
            </g>
          ))}
        </g>

        {/* Sello con "XOCOLATÍSIMO" en anillo (el logo va encima, en HTML) */}
        <circle cx="30" cy="34" r="14" fill="#fff" />
        <g className="xoco-bar-ring">
          <text fontSize="2.7" fontWeight="700" letterSpacing="0.4" fill={GOLD}>
            <textPath href={`#${ringId}`} textLength="65" lengthAdjust="spacing">
              XOCOLATÍSIMO · XOCOLATÍSIMO ·
            </textPath>
          </text>
        </g>

        {/* Etiqueta negra */}
        <rect x="13" y="53" width="34" height="30" fill="#111" />
        <text x="30" y="62" textAnchor="middle" fontSize="4.4" fontWeight="700" fill="#fff">
          CHOCOLATE
        </text>
        <text x="30" y="67.5" textAnchor="middle" fontSize="2.2" fill="#fff" opacity="0.85">
          OSCURO / DARK
        </text>
        <text x="30" y="74.5" textAnchor="middle" fontSize="4.2" fontWeight="700" fill="#fff">
          85%
        </text>
      </svg>

      {/* Logo al centro del sello: centro (30, 34), 13 x 13 del viewBox */}
      <XocolatisimoMark className="absolute top-[27.5%] left-[39.17%] w-[21.67%] text-[#8a5a2b]" />
    </div>
  );
}
