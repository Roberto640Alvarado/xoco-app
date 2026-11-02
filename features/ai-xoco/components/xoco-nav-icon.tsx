"use client";

import { cn } from "@/lib/utils";
import { XocoAgent } from "./xoco-agent";

/**
 * Xoco, el agente de chocolate, como ícono del menú lateral. Un poco más
 * grande que los íconos normales (24px vs 16px) pero con margen negativo,
 * para que el texto quede alineado con el resto del menú. El `!` gana a la
 * regla del menú que fuerza todos los svg a 16px.
 */
export function XocoNavIcon({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("-mx-1 inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-6!", className)}>
      <XocoAgent size={24} sparkles={false} />
    </span>
  );
}
