"use client";

import { Building2, CalendarCheck2, CalendarClock, DollarSign, LayoutDashboard, ListOrdered, Package, Receipt, Search, Settings, Store, Tags, TrendingUp, Users, Wallet } from "lucide-react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";

// Todos los reportes viven en un solo bloque sin título (el usuario pidió
// quitar las secciones "General" y "Reportes"); solo "Sistema" conserva
// encabezado porque separa el panel de datos de la administración.
//
// Los ítems relacionados van agrupados en submenús colapsables (`children`)
// en vez de listarse sueltos: cada submenú es un "tipo" de dato — Productos
// (ranking + categorías), Tráfico (visitas = tráfico de la tienda), Ventas
// (mensual/diaria y su desglose por medio de pago), Mayoreo (venta a granel
// y quién compra) y Tickets. "Cierre del mes" queda como ítem directo porque
// no comparte tipo con ninguno.
const NAV_ITEMS: DashboardNavItem[] = [
  {
    label: "Productos",
    icon: Package,
    group: "",
    children: [
      { label: "Mejores productos", href: "/dashboard/productos", icon: Package },
      { label: "Categorías", href: "/dashboard/categorias", icon: Tags },
    ],
  },
  {
    label: "Tráfico",
    icon: Users,
    group: "",
    children: [
      { label: "Visitas", href: "/dashboard/visitas", icon: Users },
      { label: "Tráfico de tiendas", href: "/dashboard/trafico-tiendas", icon: Store },
      { label: "Tráfico diario", href: "/dashboard/trafico-diario", icon: TrendingUp },
    ],
  },
  {
    label: "Ventas",
    icon: DollarSign,
    group: "",
    children: [
      { label: "Resumen", href: "/dashboard", icon: LayoutDashboard },
      { label: "Venta mensual", href: "/dashboard/venta-mensual", icon: DollarSign },
      { label: "Venta diaria", href: "/dashboard/venta-diaria", icon: CalendarClock },
      { label: "Efectivo y otros medios", href: "/dashboard/efectivo-otros-medios", icon: Wallet },
    ],
  },
  {
    label: "Mayoreo",
    icon: Building2,
    group: "",
    children: [
      { label: "Ventas mayoreo", href: "/dashboard/ventas-mayoreo", icon: Building2 },
      { label: "Buscar compradores", href: "/dashboard/buscar-compradores", icon: Search },
    ],
  },
  {
    label: "Tickets",
    icon: Receipt,
    group: "",
    children: [
      { label: "Ticket promedio", href: "/dashboard/ticket-promedio", icon: Receipt },
      { label: "Ticket detallado", href: "/dashboard/ticket-detallado", icon: ListOrdered },
    ],
  },
  { label: "Cierre del mes", href: "/dashboard/cierre-mes", icon: CalendarCheck2, group: "" },

  { label: "Administración", href: "/dashboard/admin", icon: Settings, group: "Sistema", roles: ["SUPER_ADMIN"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV_ITEMS} dashboardHref="/dashboard">
      {children}
    </DashboardShell>
  );
}
