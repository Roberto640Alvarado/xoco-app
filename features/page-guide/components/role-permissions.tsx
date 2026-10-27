import { Check, X } from "lucide-react";
import { cn } from "cn";
import type { InfoBadgeTone } from "@/design-system/components/info-badge";

/** Tono del badge de cada rol: Admin violeta, Finanzas azul, Vendedor ámbar, Planta verde. */
export const ROLE_TONE: Record<"admin" | "finanzas" | "vendedor" | "planta", InfoBadgeTone> = {
  admin: "violet",
  finanzas: "info",
  vendedor: "warning",
  planta: "success",
};

interface RolePermissionsProps {
  can: string[];
  cannot: string[];
}

/** Dos bloques: lo que el rol Puede y lo que No puede hacer en la pantalla.
 * "No puedes" solo aparece si hay algo que decir. */
export function RolePermissions({ can, cannot }: RolePermissionsProps) {
  return (
    <div className={cn("grid gap-3", cannot.length > 0 && "sm:grid-cols-2")}>
      <div className="rounded-lg border border-emerald-600/25 bg-emerald-500/5 px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Puedes</p>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {can.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm leading-snug text-foreground">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      {cannot.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">No puedes</p>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {cannot.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm leading-snug text-foreground">
                <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
