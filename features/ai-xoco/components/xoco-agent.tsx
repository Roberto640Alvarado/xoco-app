"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type XocoAgentMood = "idle" | "thinking" | "talking";

interface XocoAgentProps {
  /** idle: flota y parpadea · thinking: los ojos escanean · talking: ecualizador en el visor. */
  mood?: XocoAgentMood;
  /** Ancho en px (el alto es igual). */
  size?: number;
  /** Aura y anillo orbital. Apágalo en tamaños chicos (avatar). */
  sparkles?: boolean;
  className?: string;
}

const GOLD = "#f2c46d";

// Recorrido de la chispa por el anillo (elipse girada -12°): se apaga
// cuando pasa por detrás de la cabeza.
const ORBIT = (() => {
  const steps = 36;
  const tilt = (-12 * Math.PI) / 180;
  const cx: number[] = [];
  const cy: number[] = [];
  const opacity: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 66 * Math.cos(t);
    const y = 17 * Math.sin(t);
    cx.push(80 + x * Math.cos(tilt) - y * Math.sin(tilt));
    cy.push(88 + x * Math.sin(tilt) + y * Math.cos(tilt));
    opacity.push(y > 0 ? 1 : Math.abs(x) > 40 ? 0.6 : 0);
  }
  return { cx, cy, opacity };
})();
const GLOW = "#ffd89a";

/**
 * "Xoco", el agente de IA de Xocolatísimo: una cabeza de bombón de chocolate
 * con visor de vidrio oscuro y ojos de luz dorada, antena con señal, anillo
 * orbital y un chorrito de chocolate que gotea. Respeta prefers-reduced-motion.
 */
export function XocoAgent({ mood = "idle", size = 160, sparkles = true, className }: XocoAgentProps) {
  const reduce = useReducedMotion();
  const raw = useId();
  const id = raw.replace(/[^a-zA-Z0-9]/g, "");
  const animate = !reduce;

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Xoco, el asistente de IA de Xocolatísimo"
    >
      <svg viewBox="0 0 160 160" width={size} height={size} className="overflow-visible">
        <defs>
          <linearGradient id={`shell-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8a5434" />
            <stop offset="55%" stopColor="#5a3421" />
            <stop offset="100%" stopColor="#2e1a10" />
          </linearGradient>
          <linearGradient id={`visor-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a0e08" />
            <stop offset="100%" stopColor="#0d0704" />
          </linearGradient>
          <radialGradient id={`aura-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.45" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Mitad de abajo del anillo (pasa por delante de la cabeza) */}
          <clipPath id={`front-${id}`}>
            <rect x="0" y="88" width="160" height="40" transform="rotate(-12 80 88)" />
          </clipPath>
          <clipPath id={`visor-clip-${id}`}>
            <rect x="44" y="74" width="72" height="30" rx="15" />
          </clipPath>
        </defs>

        {/* Aura que respira */}
        {sparkles && (
          <motion.circle
            cx="80"
            cy="84"
            r="70"
            fill={`url(#aura-${id})`}
            animate={animate ? { opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] } : { opacity: 0.7 }}
            style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Sombra */}
        <motion.ellipse
          cx="80"
          cy="152"
          rx="34"
          ry="4.5"
          fill="currentColor"
          className="text-foreground/20"
          animate={animate ? { scaleX: [1, 0.8, 1], opacity: [0.8, 0.45, 0.8] } : undefined}
          style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.g animate={animate ? { y: [0, -6, 0] } : undefined} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          {/* Anillo orbital (detrás) */}
          {sparkles && (
            <ellipse cx="80" cy="88" rx="66" ry="17" fill="none" stroke={GOLD} strokeOpacity="0.35" strokeWidth="1.5" transform="rotate(-12 80 88)" />
          )}

          {/* Antena */}
          <line x1="80" y1="40" x2="80" y2="24" stroke="#3b2216" strokeWidth="4" strokeLinecap="round" />
          <motion.circle
            cx="80"
            cy="20"
            r="6"
            fill={GOLD}
            filter={`url(#glow-${id})`}
            animate={animate ? { scale: mood === "thinking" ? [1, 1.35, 1] : [1, 1.15, 1], opacity: [0.85, 1, 0.85] } : undefined}
            style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
            transition={{ duration: mood === "thinking" ? 0.7 : 1.8, repeat: Infinity }}
          />
          {animate && (
            <motion.circle
              cx="80"
              cy="20"
              r="6"
              fill="none"
              stroke={GOLD}
              strokeWidth="1.5"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.6, opacity: 0 }}
              style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}

          {/* Orejas / sensores */}
          <rect x="24" y="78" width="10" height="22" rx="5" fill="#3b2216" />
          <rect x="126" y="78" width="10" height="22" rx="5" fill="#3b2216" />
          <circle cx="29" cy="89" r="2.4" fill={GOLD} opacity="0.9" />
          <circle cx="131" cy="89" r="2.4" fill={GOLD} opacity="0.9" />

          {/* Cabeza: bombón cuadrado con bordes redondos */}
          <rect x="32" y="40" width="96" height="88" rx="30" fill={`url(#shell-${id})`} />
          {/* Hilo de chocolate decorado arriba (como bombón de vitrina) */}
          <path
            d="M 52 56 C 58 48, 64 62, 70 54 S 82 48, 88 56 S 100 62, 108 52"
            stroke="#c48a5c"
            strokeOpacity="0.7"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 52 59 C 58 51, 64 65, 70 57 S 82 51, 88 59 S 100 65, 108 55"
            stroke="#2e1a10"
            strokeOpacity="0.35"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Brillo lateral */}
          <path d="M 40 70 Q 40 52 56 46" stroke="#fff" strokeOpacity="0.18" strokeWidth="4" strokeLinecap="round" fill="none" />

          {/* Visor */}
          <rect x="44" y="74" width="72" height="30" rx="15" fill={`url(#visor-${id})`} stroke="#000" strokeOpacity="0.3" />
          <g clipPath={`url(#visor-clip-${id})`}>
            {/* Barrido de luz en el vidrio */}
            {animate && (
              <motion.rect
                x="30"
                y="70"
                width="14"
                height="40"
                fill="#fff"
                opacity="0.08"
                transform="skewX(-20)"
                animate={{ x: [0, 110] }}
                transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
              />
            )}

            {mood === "talking" ? (
              // Ecualizador
              [58, 66, 74, 82, 90, 98].map((x, index) => (
                <motion.rect
                  key={x}
                  x={x}
                  width="4"
                  rx="2"
                  fill={GLOW}
                  filter={`url(#glow-${id})`}
                  animate={animate ? { height: [4, 14, 6, 16, 4], y: [87, 82, 86, 81, 87] } : { height: 10, y: 84 }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.08, ease: "easeInOut" }}
                />
              ))
            ) : (
              // Ojos de luz: parpadean (idle) o escanean de lado a lado (thinking)
              <motion.g
                animate={animate && mood === "thinking" ? { x: [-8, 8, -8] } : { x: 0 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                {[64, 96].map((cx) => (
                  <motion.rect
                    key={cx}
                    x={cx - 7}
                    y="82"
                    width="14"
                    height="14"
                    rx="7"
                    fill={GLOW}
                    filter={`url(#glow-${id})`}
                    style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
                    animate={animate && mood === "idle" ? { scaleY: [1, 1, 0.12, 1, 1] } : undefined}
                    transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.46, 0.5, 0.54, 1] }}
                  />
                ))}
              </motion.g>
            )}
          </g>

          {/* Sonrisa de luz */}
          <path d="M 70 114 Q 80 120 90 114" stroke={GOLD} strokeOpacity="0.85" strokeWidth="2.6" strokeLinecap="round" fill="none" />

          {/* Gota de chocolate que se derrite del borde de abajo */}
          <path d="M 102 124 q 0 8 4 12 q 4 -4 4 -12 z" fill="#3b2216" />
          {animate && (
            <motion.circle
              cx="106"
              cy="136"
              r="2.6"
              fill="#3b2216"
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: [0, 0, 14], opacity: [0, 1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.4, 1], ease: "easeIn" }}
            />
          )}

          {/* Anillo orbital (mitad de delante) con chispa que gira */}
          {sparkles && (
            <>
              <ellipse
                cx="80"
                cy="88"
                rx="66"
                ry="17"
                fill="none"
                stroke={GOLD}
                strokeOpacity="0.6"
                strokeWidth="1.6"
                transform="rotate(-12 80 88)"
                clipPath={`url(#front-${id})`}
              />
              {animate && (
                <motion.circle
                  cx="0"
                  cy="0"
                  r="3.2"
                  fill={GLOW}
                  filter={`url(#glow-${id})`}
                  initial={{ x: ORBIT.cx[0], y: ORBIT.cy[0], opacity: 0 }}
                  animate={{ x: ORBIT.cx, y: ORBIT.cy, opacity: ORBIT.opacity }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                />
              )}
            </>
          )}
        </motion.g>
      </svg>
    </div>
  );
}
