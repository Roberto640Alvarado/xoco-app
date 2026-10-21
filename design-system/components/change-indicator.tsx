import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { InfoBadge } from "./info-badge";

const PERCENT = new Intl.NumberFormat("es-SV", { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });

interface ChangeIndicatorProps {
  /** Diferencia A − B (se usa para decidir subida/bajada cuando no hay %). */
  diff: number;
  /** (A − B) / B; null cuando B es 0 y no hay base para un porcentaje. */
  pct: number | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Pastilla de cambio entre dos períodos: flecha + porcentaje con signo.
 * Sube en verde (`success`), baja en rojo (`danger`) y sin cambio en gris;
 * la flecha y el signo repiten el sentido para no depender solo del color.
 * Sin base (B = 0) y con venta en A se muestra "Nuevo".
 */
export function ChangeIndicator({ diff, pct, size = "sm", className }: ChangeIndicatorProps) {
  if (diff === 0) {
    return (
      <InfoBadge tone="neutral" icon={Minus} size={size} className={className}>
        Sin cambio
      </InfoBadge>
    );
  }
  const up = diff > 0;
  return (
    <InfoBadge tone={up ? "success" : "danger"} icon={up ? ArrowUpRight : ArrowDownRight} size={size} className={className}>
      {pct === null ? "Nuevo" : PERCENT.format(pct)}
    </InfoBadge>
  );
}
