import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export type NoticeTone = "info" | "success" | "warning";

const TONE: Record<NoticeTone, { card: string; icon: string }> = {
  info: { card: "border-sky-500/25 bg-sky-500/[0.06]", icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  success: { card: "border-emerald-500/25 bg-emerald-500/[0.06]", icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  warning: { card: "border-amber-500/30 bg-amber-500/[0.07]", icon: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
};

interface NoticeCardProps {
  tone?: NoticeTone;
  icon: LucideIcon;
  title: string;
  /** Una frase corta. */
  description: string;
  /** Botón o link de la derecha (opcional). */
  action?: ReactNode;
  role?: "status" | "note";
  /** Ancla para el tour guiado (data-tour). */
  tourId?: string;
  className?: string;
}

/**
 * Card de aviso: ícono de color, título, una frase y (opcional) un botón.
 * Se usa para avisos de estado o recomendaciones, como la visibilidad de
 * Inventario para las tiendas.
 */
export function NoticeCard({ tone = "info", icon: Icon, title, description, action, role = "status", tourId, className }: NoticeCardProps) {
  const style = TONE[tone];
  return (
    <section
      role={role}
      data-tour={tourId}
      className={cn("flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between", style.card, className)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", style.icon)}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </section>
  );
}
