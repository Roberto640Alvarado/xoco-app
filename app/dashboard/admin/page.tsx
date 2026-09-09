import Link from "next/link";
import { KeyRound, Users, type LucideIcon } from "lucide-react";

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
    description: "Alta de cuentas, rol y activo/inactivo — SUPER_ADMIN / FINANZAS.",
  },
];

export default function AdminIndexPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            aria-disabled={section.disabled}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <section.icon className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">{section.title}</p>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
