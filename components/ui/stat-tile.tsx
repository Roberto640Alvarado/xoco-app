"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "./skeleton";

interface StatTileProps {
  label: string;
  value: string;
  /** Ícono a la derecha del valor, en su propio círculo — opcional por
   * compatibilidad, pero todas las tarjetas de números del dashboard ya le
   * pasan uno. */
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
// Esquinas redondeadas + ícono en círculo, a partir de un componente de
// referencia que pidió el usuario. La primera versión usaba el truco
// "neomórfico" clásico (doble sombra clara/oscura, sin borde) sobre
// `bg-muted` — pero en tema claro `bg-muted` (oklch .97) es casi
// indistinguible del fondo de la página (oklch 1), así que la sombra clara
// quedaba invisible y la tarjeta se veía "plana" (feedback del usuario con
// una captura). Se volvió al mismo recurso que ya usa el resto del
// dashboard para que una tarjeta se note sobre el fondo: `border-border` +
// `bg-card` (el mismo par que, por ejemplo, ya usan las Card normales), acá
// sumado a una sola sombra suave de elevación en vez de la sombra doble —
// ese combo si se nota en ambos temas porque `--border`/`--card` ya están
// calibrados para eso, en vez de depender de una diferencia de 3% de luz
// entre dos grises que además cambia de tema a tema.
export function StatTile({ label, value, icon: Icon, isLoading, isError }: StatTileProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_12px_28px_-10px_rgba(0,0,0,0.6)]"
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </motion.div>
  );
}
