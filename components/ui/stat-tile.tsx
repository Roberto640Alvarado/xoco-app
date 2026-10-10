"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "./skeleton";

interface StatTileProps {
  label: string;
  value: string;
  /** Ícono neomórfico a la derecha del valor — opcional por compatibilidad,
   * pero todas las tarjetas de números del dashboard ya le pasan uno. */
  icon?: LucideIcon;
  isLoading?: boolean;
  /** La query que alimenta el tile falló — ver nota abajo. */
  isError?: boolean;
}

// Contrato de stat tile (ver dataviz skill): label en minúsculas sin dos
// puntos, value en semibold con figuras proporcionales.
//
// Con `isError` muestra un guion en vez del `value` recibido: cuando la
// petición falla, las páginas calculan sus totales sobre un arreglo vacío
// y el tile terminaba anunciando un "$0.00" que parece un dato real. El
// mensaje del error lo da la gráfica/tabla de al lado (ChartErrorState),
// así que acá no se repite.
//
// Estilo neomórfico (pedido por el usuario, a partir de un componente de
// referencia): la tarjeta y el círculo del ícono usan `bg-muted` —no un
// gris genérico fuera del sistema de diseño— porque el truco del "soft UI"
// (una sombra oscura abajo-derecha + un resalte claro arriba-izquierda)
// solo se nota si el fondo de la tarjeta tiene margen para aclararse Y
// oscurecerse; sobre el blanco puro de `bg-background` el resalte
// quedaría invisible. `--muted` ya es el tono que el resto del dashboard
// usa para superficies ligeramente elevadas (ver el badge del logo en el
// sidebar/login), así que esto no introduce una paleta nueva.
export function StatTile({ label, value, icon: Icon, isLoading, isError }: StatTileProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex items-center justify-between gap-4 rounded-3xl bg-muted p-5 shadow-[6px_6px_14px_rgba(0,0,0,0.07),-6px_-6px_14px_rgba(255,255,255,0.8)] dark:shadow-[6px_6px_16px_rgba(0,0,0,0.5),-6px_-6px_16px_rgba(255,255,255,0.045)]"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-1 h-8 w-24" />
        ) : isError ? (
          <p className="mt-0.5 text-2xl font-semibold text-muted-foreground" aria-label="Sin dato">
            —
          </p>
        ) : (
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        )}
      </div>

      {Icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.05)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </motion.div>
  );
}
