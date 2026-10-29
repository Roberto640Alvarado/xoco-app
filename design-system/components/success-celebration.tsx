"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "cn";

interface SuccessCelebrationProps {
  title: string;
  description?: ReactNode;
  /** Dibujo en lugar del ✓ (ej. `<DeliveryTruck mode="depart" />`). */
  visual?: ReactNode;
  className?: string;
}

const CONFETTI = [
  { x: -70, y: -50, color: "bg-amber-400", delay: 0 },
  { x: 64, y: -58, color: "bg-emerald-500", delay: 0.05 },
  { x: -48, y: 40, color: "bg-violet-500", delay: 0.1 },
  { x: 80, y: 30, color: "bg-sky-500", delay: 0.08 },
  { x: -88, y: -6, color: "bg-rose-400", delay: 0.12 },
  { x: 92, y: -14, color: "bg-amber-600", delay: 0.03 },
];

/**
 * Pantalla breve de "¡Listo!" al terminar una acción importante (enviar una
 * solicitud, despachar). Un ✓ que aparece con un pequeño rebote y confeti, o
 * el dibujo que se pase en `visual`. Anuncia el título a lectores de pantalla
 * (`role="status"`) y sin animación con `prefers-reduced-motion`.
 */
export function SuccessCelebration({ title, description, visual, className }: SuccessCelebrationProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      role="status"
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex flex-col items-center justify-center gap-4 px-6 py-10 text-center", className)}
    >
      {visual ?? (
        <div className="relative flex size-24 items-center justify-center">
          {!reduce &&
            CONFETTI.map((piece) => (
              <motion.span
                key={`${piece.x}-${piece.y}`}
                aria-hidden="true"
                className={cn("absolute size-2.5 rounded-sm", piece.color)}
                initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
                animate={{ x: piece.x, y: piece.y, opacity: [0, 1, 0], rotate: 180 }}
                transition={{ duration: 1.1, delay: 0.15 + piece.delay, ease: "easeOut" }}
              />
            ))}
          {!reduce && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-emerald-500/25"
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          )}
          <motion.span
            className="flex size-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 16 }}
          >
            <Check className="size-10" strokeWidth={3} aria-hidden="true" />
          </motion.span>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-bold text-foreground">{title}</p>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
    </motion.div>
  );
}
