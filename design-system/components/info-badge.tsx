import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export type InfoBadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "violet";

const TONE: Record<InfoBadgeTone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  info: { badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
  success: { badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  warning: { badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  danger: { badge: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  violet: { badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
};

interface InfoBadgeProps {
  tone?: InfoBadgeTone;
  /** Ícono a la izquierda (ej. Info). Excluyente con `dot`. */
  icon?: LucideIcon;
  /** Punto de color a la izquierda: para estados (Pendiente, Confirmado...). */
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}

/**
 * Badge de información: pastilla de color con texto corto. Sirve para
 * estados (con `dot`), roles y avisos breves (con `icon`). Los tonos son los
 * mismos en todo el panel: warning = espera algo, info = en curso, success =
 * listo, danger = rechazado/error, violet = en tránsito, neutral = sin énfasis.
 */
export function InfoBadge({ tone = "info", icon: Icon, dot = false, size = "md", className, children }: InfoBadgeProps) {
  const style = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
        style.badge,
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden="true" />}
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {children}
    </span>
  );
}
