"use client";

import { Building2, CalendarCheck2, CalendarClock, CalendarDays, DollarSign, LayoutDashboard, ListOrdered, Package, Receipt, Search, Settings, Tags, TrendingUp, Users, Wallet } from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";

// El orden de agrupos que se muestra en el sidebar (secciones "General" /
// "Reportes" / "Sistema") lo define GROUP_ORDER en dashboard-shell.tsx, no
// el orden de este arreglo — pero se mantiene igual aquí por legibilidad.
const NAV_ITEMS: DashboardNavItem[] = [
  { label: "Ventas", href: "/dashboard", icon: LayoutDashboard, group: "General" },
  { label: "Productos", href: "/dashboard/productos", icon: Package, group: "General" },
  { label: "Categorías", href: "/dashboard/categorias", icon: Tags, group: "General" },
  { label: "Visitas", href: "/dashboard/visitas", icon: Users, group: "General" },
  { label: "Buscar compradores", href: "/dashboard/buscar-compradores", icon: Search, group: "General" },

  { label: "Tráfico de tiendas", href: "/dashboard/trafico-tiendas", icon: TrendingUp, group: "Reportes" },
  { label: "Tráfico Diario", href: "/dashboard/trafico-diario", icon: CalendarDays, group: "Reportes" },
  { label: "Venta Mensual", href: "/dashboard/venta-mensual", icon: DollarSign, group: "Reportes" },
  { label: "Ventas Mayoreo", href: "/dashboard/ventas-mayoreo", icon: Building2, group: "Reportes" },
  { label: "Efectivo y otros medios", href: "/dashboard/efectivo-otros-medios", icon: Wallet, group: "Reportes" },
  { label: "Venta Diaria", href: "/dashboard/venta-diaria", icon: CalendarClock, group: "Reportes" },
  { label: "Ticket Promedio", href: "/dashboard/ticket-promedio", icon: Receipt, group: "Reportes" },
  { label: "Ticket Detallado", href: "/dashboard/ticket-detallado", icon: ListOrdered, group: "Reportes" },
  { label: "Cierre del mes", href: "/dashboard/cierre-mes", icon: CalendarCheck2, group: "Reportes" },

  { label: "Administración", href: "/dashboard/admin", icon: Settings, group: "Sistema", roles: ["SUPER_ADMIN"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV_ITEMS} dashboardHref="/dashboard">
      {children}
    </DashboardShell>
  );
}
