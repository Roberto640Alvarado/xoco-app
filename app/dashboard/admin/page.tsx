import Link from "next/link";
import { ReportHeader } from "@/features/page-guide/components/report-header";
import { ArrowRight, KeyRound, Palette, ShieldCheck, Users, Warehouse, type LucideIcon } from "lucide-react";

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
    description: "Cuentas, roles y acceso al panel.",
  },
  {
    href: "/dashboard/admin/permisos",
    icon: ShieldCheck,
    title: "Permisos",
    description: "Qué módulos ve cada rol en el menú.",
  },
  {
    href: "/dashboard/admin/inventario",
    icon: Warehouse,
    title: "Inventario por tienda",
    description: "Habilita Inventario para los Vendedores de cada tienda.",
  },
  {
    href: "/dashboard/admin/design-system",
    icon: Palette,
    title: "Sistema de diseño",
    description: "Botones, badges, cards y tablas del panel, con ejemplos.",
  },
];

export default function AdminIndexPage() {
  return (
    <div className="flex flex-col gap-4">
      <ReportHeader page="admin-inicio" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            aria-disabled={section.disabled}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/30 hover:shadow-sm aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <section.icon className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">{section.title}</p>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            <ArrowRight
              className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
