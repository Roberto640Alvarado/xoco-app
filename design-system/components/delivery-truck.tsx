"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";

type TruckSize = "sm" | "md" | "lg";

interface DeliveryTruckProps {
  /**
   * `road`: el camión rueda en su lugar mientras la carretera pasa debajo
   * (envío en camino). `depart`: arranca y sale por la derecha una sola vez
   * (al despachar).
   */
  mode?: "road" | "depart";
  size?: TruckSize;
  /** Texto para lectores de pantalla. */
  label?: string;
  className?: string;
}

const HEIGHT: Record<TruckSize, string> = { sm: "h-10", md: "h-16", lg: "h-28" };

// Camión del envío (cabina + caja con una tableta de chocolate). Colores del
// tema: caja `primary`, cabina violeta (el tono "en tránsito" del panel).
function TruckSvg({ animate }: { animate: boolean }) {
  const spin = animate ? { rotate: 360 } : undefined;
  const wheelTransition = { repeat: Infinity, duration: 0.6, ease: "linear" as const };
  return (
    <motion.svg
      viewBox="0 0 120 64"
      className="h-full w-auto overflow-visible"
      aria-hidden="true"
      animate={animate ? { y: [0, -1.2, 0] } : undefined}
      transition={{ repeat: Infinity, duration: 0.35, ease: "easeInOut" }}
    >
      {/* Caja */}
      <rect x="4" y="8" width="70" height="38" rx="6" className="fill-primary" />
      <rect x="10" y="14" width="58" height="26" rx="4" className="fill-primary-foreground" opacity="0.12" />
      {/* Tableta de chocolate en la caja */}
      <g transform="translate(24 18)">
        <rect width="30" height="18" rx="3" fill="#7b4a2a" />
        {[0, 1, 2].map((col) =>
          [0, 1].map((row) => (
            <rect key={`${col}-${row}`} x={2 + col * 9.5} y={2 + row * 8} width="7.5" height="6" rx="1.4" fill="#9a6440" />
          )),
        )}
      </g>
      {/* Cabina */}
      <path d="M76 18 h20 l14 14 v14 h-34 z" className="fill-violet-500" />
      <path d="M80 22 h14 l9 10 h-23 z" className="fill-sky-100 dark:fill-sky-200" />
      <rect x="104" y="38" width="6" height="4" rx="1" className="fill-amber-300" />
      {/* Ruedas */}
      {[22, 56, 96].map((cx) => (
        <motion.g key={cx} style={{ originX: `${cx}px`, originY: "50px" }} animate={spin} transition={wheelTransition}>
          <circle cx={cx} cy="50" r="8" className="fill-foreground" />
          <circle cx={cx} cy="50" r="3.2" className="fill-muted" />
          <rect x={cx - 0.8} y="43" width="1.6" height="4" rx="0.8" className="fill-muted" />
        </motion.g>
      ))}
    </motion.svg>
  );
}

/**
 * Camión animado de "en camino". Lo usan las solicitudes de stock: en la
 * tarjeta y el detalle de un envío EN_CAMINO (`road`) y al despachar
 * (`depart`). Con `prefers-reduced-motion` queda quieto.
 */
export function DeliveryTruck({ mode = "road", size = "md", label = "Envío en camino", className }: DeliveryTruckProps) {
  const reduce = useReducedMotion() ?? false;
  const animate = !reduce;

  return (
    <div role="img" aria-label={label} className={cn("relative w-full overflow-hidden", HEIGHT[size], className)}>
      {/* Carretera: línea punteada que corre hacia la izquierda */}
      <div className="absolute inset-x-0 bottom-[6%] h-[3px] overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full w-[200%] bg-[repeating-linear-gradient(90deg,var(--muted-foreground)_0_14px,transparent_14px_28px)] opacity-60"
          animate={animate ? { x: ["0%", "-50%"] } : undefined}
          transition={{ repeat: Infinity, duration: mode === "depart" ? 0.6 : 1.4, ease: "linear" }}
        />
      </div>

      <motion.div
        className="absolute bottom-[6%] h-[82%]"
        style={mode === "road" ? { left: "50%", x: "-50%" } : undefined}
        initial={mode === "depart" ? { left: animate ? "-30%" : "38%" } : false}
        animate={mode === "depart" && animate ? { left: ["-30%", "38%", "38%", "115%"] } : undefined}
        transition={mode === "depart" ? { duration: 2.4, times: [0, 0.3, 0.55, 1], ease: "easeInOut" } : undefined}
      >
        {/* Nubecitas de humo que salen por detrás del camión */}
        {animate &&
          [0, 0.35, 0.7].map((delay) => (
            <motion.span
              key={delay}
              aria-hidden="true"
              className="absolute bottom-[18%] -left-1 size-2 rounded-full bg-muted-foreground/40"
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.8, 0], x: -18, y: -6, scale: 1.5 }}
              transition={{ repeat: Infinity, duration: 1.05, delay, ease: "easeOut" }}
            />
          ))}
        <TruckSvg animate={animate} />
      </motion.div>
    </div>
  );
}
