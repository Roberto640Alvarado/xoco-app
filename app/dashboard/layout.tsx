"use client";

import { CalendarDays, DollarSign, LayoutDashboard, Package, Settings, TrendingUp, Users } from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";

const NAV_ITEMS: DashboardNavItem[] = [
  { label: "Tráfico de tiendas", href: "/dashboard/trafico-tiendas", icon: TrendingUp },
  { label: "Tráfico Diario", href: "/dashboard/trafico-diario", icon: CalendarDays },
  { label: "Venta Mensual", href: "/dashboard/venta-mensual", icon: DollarSign },
  { label: "Ventas", href: "/dashboard", icon: LayoutDashboard },
  { label: "Visitas", href: "/dashboard/visitas", icon: Users },
  { label: "Productos", href: "/dashboard/productos", icon: Package },
  { label: "Administración", href: "/dashboard/admin", icon: Settings, roles: ["SUPER_ADMIN"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV_ITEMS} dashboardHref="/dashboard">
      {children}
    </DashboardShell>
  );
}
