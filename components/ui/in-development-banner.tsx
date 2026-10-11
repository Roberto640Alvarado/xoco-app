import { Construction } from "lucide-react";

interface InDevelopmentBannerProps {
  message?: string;
}

// Aviso reutilizable para módulos que ya están habilitados para su
// audiencia restringida (ej. Admin/Finanzas) pero todavía en desarrollo —
// para que quien lo vea sepa que puede cambiar o tener datos incompletos,
// sin tener que ocultar la pantalla mientras se termina de afinar.
export function InDevelopmentBanner({
  message = "Este módulo está en desarrollo. Lo que ves puede cambiar y algunos datos todavía no están completos.",
}: InDevelopmentBannerProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
    >
      <Construction className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
