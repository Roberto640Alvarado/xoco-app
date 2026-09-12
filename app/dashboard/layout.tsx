"use client";

import { Building2, CalendarCheck2, CalendarClock, CalendarDays, DollarSign, LayoutDashboard, ListOrdered, Package, Receipt, Search, Settings, Tags, TrendingUp, Users, Wallet } from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";

const NAV_ITEMS: DashboardNavItem[] = [
  { label: "Tráfico de tiendas", href: "/dashboard/trafico-tiendas", icon: TrendingUp },
  { label: "Tráfico Diario", href: "/dashboard/trafico-diario", icon: CalendarDays },
  { label: "Venta Mensual", href: "/dashboard/venta-mensual", icon: DollarSign },
  { label: "Ventas Mayoreo", href: "/dashboard/ventas-mayoreo", icon: Building2 },
  { label: "Efectivo y otros medios", href: "/dashboard/efectivo-otros-medios", icon: Wallet },
  { label: "Venta Diaria", href: "/dashboard/venta-diaria", icon: CalendarClock },
  { label: "Ticket Promedio", href: "/dashboard/ticket-promedio", icon: Receipt },
  { label: "Ticket Detallado", href: "/dashboard/ticket-detallado", icon: ListOrdered },
  { label: "Cierre del mes", href: "/dashboard/cierre-mes", icon: CalendarCheck2 },
  { label: "Ventas", href: "/dashboard", icon: LayoutDashboard },
  { label: "Visitas", href: "/dashboard/visitas", icon: Users },
  { label: "Buscar compradores", href: "/dashboard/buscar-compradores", icon: Search },
  { label: "Productos", href: "/dashboard/productos", icon: Package },
  { label: "Categorías", href: "/dashboard/categorias", icon: Tags },
  { label: "Administración", href: "/dashboard/admin", icon: Settings, roles: ["SUPER_ADMIN"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV_ITEMS} dashboardHref="/dashboard">
      {children}
    </DashboardShell>
  );
}
