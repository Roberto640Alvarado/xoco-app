import {
  BookOpenCheck,
  CalendarCheck2,
  DollarSign,
  LayoutDashboard,
  MessageCircle,
  Package,
  PackageMinus,
  PackagePlus,
  Receipt,
  Store,
  TrendingUp,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/features/auth/types/auth.types";

export interface HomeShortcut {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Mismo moduleKey que el menú: si el Admin lo quitó en Permisos, no sale. */
  moduleKey?: string;
  /** Pantalla de Inventario (al Vendedor solo le sale si su tienda está habilitada). */
  inventory?: boolean;
}

// Accesos rápidos por rol: lo que cada quien usa más.
export const SHORTCUTS: Record<UserRole, HomeShortcut[]> = {
  SUPER_ADMIN: [
    { title: "Xoco IA", description: "Pregunta por ventas, metas e inventario", href: "/dashboard/ia-xoco/chat", icon: MessageCircle },
    { title: "Resumen de ventas", description: "Venta, órdenes y ticket de los últimos días", href: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard.resumen" },
    { title: "Venta mensual", description: "La cifra oficial por tienda", href: "/dashboard/venta-mensual", icon: DollarSign, moduleKey: "dashboard.venta-mensual" },
    { title: "Cierre del mes", description: "Metas y resultado de cada tienda", href: "/dashboard/cierre-mes", icon: CalendarCheck2, moduleKey: "dashboard.cierre-mes" },
    { title: "Inventario", description: "Existencia y conteo por tienda", href: "/dashboard/inventario", icon: Warehouse, moduleKey: "dashboard.inventario", inventory: true },
    { title: "Usuarios", description: "Cuentas, roles y accesos", href: "/dashboard/admin/users", icon: Users },
  ],
  FINANZAS: [
    { title: "Resumen de ventas", description: "Venta, órdenes y ticket de los últimos días", href: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard.resumen" },
    { title: "Venta mensual", description: "La cifra oficial por tienda", href: "/dashboard/venta-mensual", icon: DollarSign, moduleKey: "dashboard.venta-mensual" },
    { title: "Cierre del mes", description: "Metas y resultado de cada tienda", href: "/dashboard/cierre-mes", icon: CalendarCheck2, moduleKey: "dashboard.cierre-mes" },
    { title: "Movimientos por confirmar", description: "Entradas, mermas y regalías de las tiendas", href: "/dashboard/inventario/movimientos", icon: PackageMinus, moduleKey: "dashboard.inventario-movimientos", inventory: true },
    { title: "Kardex", description: "Entradas, salidas y saldos por tienda", href: "/dashboard/inventario/kardex", icon: BookOpenCheck, moduleKey: "dashboard.inventario", inventory: true },
    { title: "Ticket promedio", description: "Cuánto compra cada cliente", href: "/dashboard/ticket-promedio", icon: Receipt, moduleKey: "dashboard.ticket-promedio" },
  ],
  VENDEDOR: [
    { title: "Resumen de mi tienda", description: "Cómo van las ventas", href: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard.resumen" },
    { title: "Venta diaria", description: "Día por día", href: "/dashboard/venta-diaria", icon: TrendingUp, moduleKey: "dashboard.venta-diaria" },
    { title: "Mejores productos", description: "Lo que más se vende", href: "/dashboard/productos", icon: Package, moduleKey: "dashboard.productos" },
    { title: "Mi inventario", description: "Lo que hay en la tienda", href: "/dashboard/inventario", icon: Warehouse, moduleKey: "dashboard.inventario", inventory: true },
    { title: "Pedir producto", description: "Solicitudes a planta o a otra tienda", href: "/dashboard/inventario/solicitudes", icon: PackagePlus, moduleKey: "dashboard.inventario-solicitudes", inventory: true },
    { title: "Movimientos", description: "Registrar entradas, mermas y regalías", href: "/dashboard/inventario/movimientos", icon: PackageMinus, moduleKey: "dashboard.inventario-movimientos", inventory: true },
  ],
  PLANTA: [
    { title: "Solicitudes", description: "Lo que piden las tiendas", href: "/dashboard/inventario/solicitudes", icon: PackagePlus },
    { title: "Inventario de tiendas", description: "Qué hay en cada tienda (solo ver)", href: "/dashboard/inventario", icon: Store },
  ],
};
