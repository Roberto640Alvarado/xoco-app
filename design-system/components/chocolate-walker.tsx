import { cn } from "cn";
import { XocolatisimoMark } from "@/components/brand/xocolatisimo-mark";

interface ChocolateWalkerProps {
  className?: string;
}

// Cuadros de la tableta que quedan a la vista (arriba de la envoltura): 2 x 2.
const SQUARES = [
  { x: 31, y: 25 },
  { x: 61, y: 25 },
  { x: 31, y: 48 },
  { x: 61, y: 48 },
];

/**
 * "Xoco caminando": tableta de chocolate con cuadritos en relieve, una
 * mordida con migas, envoltura dorada con el logo de Xocolatísimo y carita.
 * Camina con brazos y piernas, se estira y se aplasta con cada paso, se
 * balancea y saluda de vez en cuando. Keyframes `walker-*` en app/globals.css;
 * con prefers-reduced-motion se queda quieta.
 */
export function ChocolateWalker({ className }: ChocolateWalkerProps) {
  return (
    <div className={cn("walker relative aspect-[120/150] w-32", className)} aria-hidden="true">
      {/* Piso, sombra y líneas de velocidad (no rebotan) */}
      <svg viewBox="0 0 120 150" className="absolute inset-0 h-full w-full">
        <ellipse className="walker-shadow" cx="60" cy="141" rx="26" ry="3.8" fill="currentColor" opacity="0.18" />
        <g className="walker-ground" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.22">
          {[0, 20, 40, 60, 80, 100, 120, 140].map((x) => (
            <line key={x} x1={x - 10} y1="147" x2={x - 2} y2="147" />
          ))}
        </g>
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.18">
          <line className="walker-speed" style={{ animationDelay: "0s" }} x1="4" y1="60" x2="16" y2="60" />
          <line className="walker-speed" style={{ animationDelay: "0.25s" }} x1="2" y1="76" x2="18" y2="76" />
          <line className="walker-speed" style={{ animationDelay: "0.5s" }} x1="6" y1="92" x2="15" y2="92" />
        </g>
      </svg>

      {/* Personaje */}
      <div className="walker-bob absolute inset-0">
        <div className="walker-squash absolute inset-0">
          <svg viewBox="0 0 120 150" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <linearGradient id="walker-choco" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7b4a30" />
                <stop offset="1" stopColor="#3b2216" />
              </linearGradient>
              <linearGradient id="walker-square" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8a5434" />
                <stop offset="1" stopColor="#5a3421" />
              </linearGradient>
              <linearGradient id="walker-foil" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#b8913f" />
                <stop offset="0.5" stopColor="#f2d48f" />
                <stop offset="1" stopColor="#b8913f" />
              </linearGradient>
              <linearGradient id="walker-gloss" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              {/* Mordida en la esquina de arriba a la derecha */}
              <mask id="walker-bite">
                <rect x="0" y="0" width="120" height="150" fill="#fff" />
                <circle cx="92" cy="20" r="7" fill="#000" />
                <circle cx="84" cy="17" r="5" fill="#000" />
                <circle cx="95" cy="29" r="5" fill="#000" />
              </mask>
              <clipPath id="walker-foil-clip">
                <path d="M27 72 L33 68 L39 72 L45 68 L51 72 L57 68 L63 72 L69 68 L75 72 L81 68 L87 72 L93 68 V112 Q93 120 85 120 H35 Q27 120 27 112 Z" />
              </clipPath>
            </defs>

            {/* Pierna y brazo de atrás */}
            <g className="walker-leg-b">
              <path d="M70 116 L70 134" stroke="#2a170e" strokeWidth="6.5" strokeLinecap="round" />
              <ellipse cx="73.5" cy="136" rx="8" ry="4" fill="#1d0f08" />
            </g>
            <g className="walker-arm-b">
              <path d="M92 58 Q104 68 101 82" stroke="#2a170e" strokeWidth="5.5" strokeLinecap="round" fill="none" />
              <circle cx="101" cy="84" r="4.4" fill="#5a3421" />
            </g>

            {/* Tableta */}
            <g mask="url(#walker-bite)">
              <rect x="27" y="21" width="66" height="99" rx="7" fill="url(#walker-choco)" />
              {SQUARES.map((square) => (
                <g key={`${square.x}-${square.y}`}>
                  <rect x={square.x} y={square.y} width="28" height="21" rx="2.5" fill="url(#walker-square)" />
                  {/* Bisel: luz arriba-izquierda, sombra abajo-derecha */}
                  <path d={`M${square.x + 1} ${square.y + 20} V${square.y + 2} Q${square.x + 1} ${square.y + 1} ${square.x + 2} ${square.y + 1} H${square.x + 27}`} stroke="#b27a52" strokeOpacity="0.7" strokeWidth="1.6" fill="none" />
                  <path d={`M${square.x + 27} ${square.y + 1} V${square.y + 20} H${square.x + 1}`} stroke="#1d0f08" strokeOpacity="0.55" strokeWidth="1.6" fill="none" />
                </g>
              ))}
            </g>
            {/* Migas de la mordida */}
            <g fill="#5a3421">
              <rect className="walker-crumb" style={{ animationDelay: "0s" }} x="96" y="30" width="3" height="3" rx="0.8" />
              <rect className="walker-crumb" style={{ animationDelay: "0.8s" }} x="99" y="24" width="2.4" height="2.4" rx="0.6" />
              <rect className="walker-crumb" style={{ animationDelay: "1.5s" }} x="94" y="36" width="2" height="2" rx="0.5" />
            </g>

            {/* Carita sobre los cuadros de arriba */}
            <g className="walker-eyes">
              <ellipse cx="45" cy="36" rx="5" ry="6" fill="#fff8f0" />
              <ellipse cx="75" cy="36" rx="5" ry="6" fill="#fff8f0" />
              <circle className="walker-pupil" cx="46.5" cy="37" r="2.8" fill="#1d0f08" />
              <circle className="walker-pupil" cx="76.5" cy="37" r="2.8" fill="#1d0f08" />
              <circle cx="47.4" cy="35.6" r="0.9" fill="#fff" />
              <circle cx="77.4" cy="35.6" r="0.9" fill="#fff" />
            </g>
            <ellipse cx="39" cy="45" rx="3.5" ry="2" fill="#e88a7a" opacity="0.5" />
            <ellipse cx="81" cy="45" rx="3.5" ry="2" fill="#e88a7a" opacity="0.5" />
            <path className="walker-mouth" d="M53 56 Q60 62.5 67 56" stroke="#1d0f08" strokeWidth="2.4" strokeLinecap="round" fill="#7a2f22" />

            {/* Envoltura dorada con brillo que pasa */}
            <g clipPath="url(#walker-foil-clip)">
              <rect x="20" y="60" width="80" height="70" fill="url(#walker-foil)" />
              <path d="M27 84 H93 M27 110 H93" stroke="#8a6a2f" strokeOpacity="0.35" strokeWidth="1" />
              <g transform="skewX(-20)">
                <rect className="walker-foil-shine" x="20" y="60" width="16" height="70" fill="url(#walker-gloss)" />
              </g>
            </g>

            {/* Pierna y brazo de adelante */}
            <g className="walker-leg-f">
              <path d="M50 116 L50 134" stroke="#2a170e" strokeWidth="6.5" strokeLinecap="round" />
              <ellipse cx="53.5" cy="136" rx="8" ry="4" fill="#1d0f08" />
            </g>
            <g className="walker-arm-f">
              <path d="M28 58 Q16 68 19 82" stroke="#2a170e" strokeWidth="5.5" strokeLinecap="round" fill="none" />
              <circle cx="19" cy="84" r="4.4" fill="#5a3421" />
            </g>
          </svg>

          {/* Logo de Xocolatísimo impreso en la envoltura */}
          <XocolatisimoMark className="absolute left-1/2 top-[57%] w-[22%] -translate-x-1/2 text-[#3b2216]" />
        </div>
      </div>
    </div>
  );
}
