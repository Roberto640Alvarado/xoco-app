import {
  Building2,
  CalendarCheck2,
  CalendarClock,
  DollarSign,
  GitCompareArrows,
  LayoutDashboard,
  ListOrdered,
  Package,
  PackageMinus,
  Receipt,
  ReceiptText,
  Search,
  Store,
  Tags,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "../types/permissions.types";

// Mismos íconos que cada módulo usa en el sidebar real
// (app/dashboard/layout.tsx) — para que este panel se lea de un vistazo
// como "el mismo menú, con switches", en vez de una lista de texto
// suelta sin relación visual con las pantallas que en verdad controla.
export const MODULE_ICON: Record<ModuleKey, LucideIcon> = {
  "dashboard.resumen": LayoutDashboard,
  "dashboard.visitas": Users,
  "dashboard.trafico-diario": TrendingUp,
  "dashboard.trafico-tiendas": Store,
  "dashboard.venta-diaria": CalendarClock,
  "dashboard.venta-mensual": DollarSign,
  "dashboard.efectivo-otros-medios": Wallet,
  "dashboard.ventas-mayoreo": Building2,
  "dashboard.buscar-compradores": Search,
  "dashboard.ticket-promedio": Receipt,
  "dashboard.ticket-detallado": ListOrdered,
  "dashboard.ordenes": ReceiptText,
  "dashboard.productos": Package,
  "dashboard.categorias": Tags,
  "dashboard.comparacion-productos": GitCompareArrows,
  "dashboard.cierre-mes": CalendarCheck2,
  "dashboard.inventario": Warehouse,
  "dashboard.inventario-movimientos": PackageMinus,
};

export interface ModuleGroup {
  label: string;
  moduleKeys: ModuleKey[];
}

// Mismo agrupamiento (y mismo orden) que los submenús de NAV_ITEMS en
// app/dashboard/layout.tsx — un grupo sin ningún módulo dentro del techo
// del rol elegido (ej. "Mayoreo" para Vendedor) simplemente no se
// renderiza, igual que en el sidebar real.
export const MODULE_GROUPS: ModuleGroup[] = [
  { label: "Productos", moduleKeys: ["dashboard.productos", "dashboard.categorias", "dashboard.comparacion-productos"] },
  {
    label: "Tráfico",
    moduleKeys: ["dashboard.visitas", "dashboard.trafico-tiendas", "dashboard.trafico-diario"],
  },
  {
    label: "Ventas",
    moduleKeys: [
      "dashboard.resumen",
      "dashboard.venta-mensual",
      "dashboard.venta-diaria",
      "dashboard.efectivo-otros-medios",
    ],
  },
  { label: "Mayoreo", moduleKeys: ["dashboard.ventas-mayoreo", "dashboard.buscar-compradores"] },
  { label: "Tickets", moduleKeys: ["dashboard.ticket-promedio", "dashboard.ticket-detallado", "dashboard.ordenes"] },
  { label: "Inventario", moduleKeys: ["dashboard.inventario", "dashboard.inventario-movimientos"] },
  { label: "Otros", moduleKeys: ["dashboard.cierre-mes"] },
];
