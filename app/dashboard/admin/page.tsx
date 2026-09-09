import Link from "next/link";
import { ArrowRight, KeyRound, Users, type LucideIcon } from "lucide-react";

interface AdminSection {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  disabled?: boolean;
}

const ADMIN_SECTIONS: AdminSection[] = [
  {
    href: "/dashboard/admin/odoo",
    icon: KeyRound,
    title: "Integración con Odoo",
    description: "API key y duración de la conexión con Odoo.",
  },
  {
    href: "/dashboard/admin/users",
    icon: Users,
    title: "Usuarios",
    description: "Crea cuentas, asigna su rol y activa o desactiva su acceso.",
  },
];

export default function AdminIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Administración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configuración exclusiva de Super admin — la conexión con Odoo y las cuentas del panel.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            aria-disabled={section.disabled}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/30 hover:shadow-sm aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <section.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-1 flex-col gap-0.5 pt-0.5">
              <p className="font-medium text-foreground">{section.title}</p>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            <ArrowRight
              className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
