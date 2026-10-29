import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { cn } from "cn";

interface PreviewSheetProps {
  /** Ej. "Así va tu pedido". */
  title: string;
  /** Ej. el nombre de la tienda y la fecha. */
  subtitle?: ReactNode;
  /** Aviso del listón. Por defecto deja claro que todavía no se envía nada. */
  notice?: string;
  /** Contador o badge a la derecha del título. */
  badge?: ReactNode;
  /** Pie fijo (totales, nota). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Hoja de "vista previa": muestra en vivo cómo va quedando lo que se está
 * llenando en un formulario, como una hoja de papel con un listón arriba que
 * dice que es solo una vista previa. Pensada para usuarios que casi no usan
 * computadora: lo que ven aquí es exactamente lo que recibirá el otro lado.
 * La usan Nueva solicitud (tienda) y la respuesta de planta.
 */
export function PreviewSheet({
  title,
  subtitle,
  notice = "Solo es una vista previa de cómo va quedando. Todavía no se ha enviado nada.",
  badge,
  footer,
  children,
  className,
}: PreviewSheetProps) {
  return (
    <section
      aria-label={`Vista previa: ${title}`}
      className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-muted/40", className)}
    >
      <p className="flex items-center gap-2 bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
        <Eye className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{notice}</span>
      </p>
      <div className="m-2 flex min-h-0 flex-1 flex-col rounded-xl bg-card shadow-sm ring-1 ring-border">
        <header className="flex items-start gap-2 border-b border-dashed border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          {badge}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
        {footer && <footer className="border-t border-dashed border-border px-4 py-3">{footer}</footer>}
      </div>
    </section>
  );
}
