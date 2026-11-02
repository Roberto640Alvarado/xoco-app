"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const PHRASES = ["Pensando", "Revisando los datos", "Sumando las cifras", "Armando la respuesta"];

/**
 * Como ChatGPT: un punto que late y un texto con brillo ("Pensando…", o lo
 * que está consultando ahora). Discreto, pero se nota que sigue trabajando.
 */
export function ThinkingIndicator({ activity }: { activity?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (activity) return;
    const timer = setInterval(() => setStep((value) => value + 1), 3500);
    return () => clearInterval(timer);
  }, [activity]);

  const label = activity ? `Consultando ${activity}` : PHRASES[step % PHRASES.length];

  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2.5 py-0.5">
      <motion.span
        aria-hidden="true"
        className="h-3 w-3 shrink-0 rounded-full bg-foreground"
        animate={reduce ? undefined : { scale: [1, 0.6, 1], opacity: [1, 0.55, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span key={label} className="xoco-shimmer text-sm font-medium">
        {label}…
      </span>
    </div>
  );
}
