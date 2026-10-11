import type { CSSProperties } from "react";
import { cn } from "cn";

// Borde irregular por donde se parte la tableta (x = 80 en el centro).
const BREAK_EDGE: Array<[number, number]> = [
  [80, 16],
  [84, 28],
  [79, 40],
  [84, 52],
  [79, 64],
  [84, 76],
  [80, 90],
];

const LEFT_PATH = `M28 16 H80 ${BREAK_EDGE.slice(1)
  .map(([x, y]) => `L${x} ${y}`)
  .join(" ")} H28 a8 8 0 0 1 -8 -8 V24 a8 8 0 0 1 8 -8 z`;
const RIGHT_PATH = `M80 90 ${[...BREAK_EDGE]
  .reverse()
  .slice(1)
  .map(([x, y]) => `L${x} ${y}`)
  .join(" ")} H132 a8 8 0 0 1 8 8 V82 a8 8 0 0 1 -8 8 z`;
const CRACK_PATH = BREAK_EDGE.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");

const ROWS = [22, 44, 66];
const LEFT_COLS = [26, 52];
const RIGHT_COLS = [88, 114];

const CRUMBS = [
  { dx: "-18px", dy: "-26px", cd: "0s", x: 80, y: 46, r: 2.4 },
  { dx: "20px", dy: "-30px", cd: "0.03s", x: 82, y: 40, r: 2 },
  { dx: "-10px", dy: "-18px", cd: "0.06s", x: 80, y: 60, r: 1.6 },
  { dx: "26px", dy: "-14px", cd: "0.02s", x: 83, y: 54, r: 2.2 },
  { dx: "-24px", dy: "-8px", cd: "0.05s", x: 79, y: 70, r: 1.8 },
];

function Squares({ cols }: { cols: number[] }) {
  return (
    <>
      {ROWS.flatMap((y) =>
        cols.map((x) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="24" height="18" rx="4" fill="url(#choco-break-square)" />
            <rect x={x + 2.5} y={y + 2} width="9" height="2" rx="1" fill="var(--choco-hi)" opacity="0.55" />
          </g>
        )),
      )}
    </>
  );
}

interface ChocolateBreakProps {
  className?: string;
}

/**
 * Tableta de chocolate que se parte en dos por el centro, suelta unas migas y
 * vuelve a unirse. Es la animación de "Iniciando sesión"; comparte colores con
 * ChocolateLoader (clases `choco-*` en app/globals.css) y se queda quieta si el
 * sistema pide menos movimiento.
 */
export function ChocolateBreak({ className }: ChocolateBreakProps) {
  return (
    <div className={cn("choco-loader choco-break", className)} aria-hidden="true">
      <svg viewBox="0 0 160 110" className="h-auto w-full">
        <defs>
          <linearGradient id="choco-break-square" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--choco-3)" />
            <stop offset="1" stopColor="var(--choco-2)" />
          </linearGradient>
        </defs>

        <ellipse cx="80" cy="100" rx="46" ry="4.5" fill="var(--choco-2)" opacity="0.35" />

        <g className="choco-snap-left">
          <path d={LEFT_PATH} fill="var(--choco-1)" />
          <Squares cols={LEFT_COLS} />
        </g>
        <g className="choco-snap-right">
          <path d={RIGHT_PATH} fill="var(--choco-1)" />
          <Squares cols={RIGHT_COLS} />
        </g>

        <path
          className="choco-snap-crack"
          d={CRACK_PATH}
          fill="none"
          stroke="var(--choco-hi)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {CRUMBS.map((crumb, index) => (
          <circle
            key={index}
            className="choco-crumb"
            cx={crumb.x}
            cy={crumb.y}
            r={crumb.r}
            fill="var(--choco-2)"
            style={{ "--dx": crumb.dx, "--dy": crumb.dy, "--cd": crumb.cd } as CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
