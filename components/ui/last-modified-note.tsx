import { History } from "lucide-react";
import { cn } from "cn";
import { formatDateTime } from "@/lib/format";

interface LastModifiedNoteProps {
  email: string | null;
  date: string | null;
  className?: string;
}

// Nota discreta de auditoría ("Última mod: correo · fecha") para las
// vistas de configuración de metas — se guarda `updatedByEmail`/`updatedAt`
// en cada tienda/cliente cada vez que se guarda un % de crecimiento (ver
// xoco-api: GoalsController.upsertBulk y hermanos). Antes del primer
// backfill/edición no hay dato todavía, por eso ambos campos son
// nullable — en ese caso el componente no renderiza nada.
export function LastModifiedNote({ email, date, className }: LastModifiedNoteProps) {
  if (!email || !date) return null;

  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Última mod: <span className="font-medium text-foreground/80">{email}</span> ·{" "}
        {formatDateTime(date)}
      </span>
    </p>
  );
}
