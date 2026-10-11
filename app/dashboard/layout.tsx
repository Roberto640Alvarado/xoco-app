"use client";

import { Building2, CalendarCheck2, CalendarClock, ClipboardList, DollarSign, LayoutDashboard, ListOrdered, Package, PackageMinus, PackagePlus, Receipt, Search, Settings, Store, Tags, TrendingUp, Users, Wallet, Warehouse } from "lucide-react";
import { useMemo } from "react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";
import { useMovementNotifications } from "@/features/inventory-movements/hooks/use-movement-notifications";
import { useAuthStore } from "@/store/auth-store";
import { useCanUseInventory } from "@/features/inventory-access/hooks/use-inventory-access";

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
      { label: "Mejores productos", href: "/dashboard/productos", icon: Package, moduleKey: "dashboard.productos" },
      { label: "Categorías", href: "/dashboard/categorias", icon: Tags, moduleKey: "dashboard.categorias" },
    ],
  },
  {
    label: "Tráfico",
    icon: Users,
    group: "",
    children: [
      { label: "Visitas", href: "/dashboard/visitas", icon: Users, moduleKey: "dashboard.visitas" },
      { label: "Tráfico de tiendas", href: "/dashboard/trafico-tiendas", icon: Store, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.trafico-tiendas" },
      { label: "Tráfico diario", href: "/dashboard/trafico-diario", icon: TrendingUp, moduleKey: "dashboard.trafico-diario" },
    ],
  },
  {
    label: "Ventas",
    icon: DollarSign,
    group: "",
    children: [
      { label: "Resumen", href: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard.resumen" },
      { label: "Venta mensual", href: "/dashboard/venta-mensual", icon: DollarSign, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.venta-mensual" },
      { label: "Venta diaria", href: "/dashboard/venta-diaria", icon: CalendarClock, moduleKey: "dashboard.venta-diaria" },
      { label: "Formas de pago", href: "/dashboard/efectivo-otros-medios", icon: Wallet, moduleKey: "dashboard.efectivo-otros-medios" },
    ],
  },
  {
    label: "Mayoreo",
    icon: Building2,
    group: "",
    children: [
      { label: "Ventas mayoreo", href: "/dashboard/ventas-mayoreo", icon: Building2, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.ventas-mayoreo" },
      { label: "Buscar compradores", href: "/dashboard/buscar-compradores", icon: Search, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.buscar-compradores" },
    ],
  },
  {
    label: "Tickets",
    icon: Receipt,
    group: "",
    children: [
      { label: "Ticket promedio", href: "/dashboard/ticket-promedio", icon: Receipt, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.ticket-promedio" },
      { label: "Ticket detallado", href: "/dashboard/ticket-detallado", icon: ListOrdered, moduleKey: "dashboard.ticket-detallado" },
    ],
  },
  { label: "Cierre del mes", href: "/dashboard/cierre-mes", icon: CalendarCheck2, group: "", roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.cierre-mes" },

  // Submenú Inventario (ver plan-history): pantallas separadas.
  // - Conteo: existencia por producto. Admin/Finanzas la capturan (conteo
  //   físico); el Vendedor la ve en SOLO LECTURA y solo de su tienda
  //   (assertOwnStoreOrThrow en el backend; el PUT es solo Admin/Finanzas).
  // - Movimientos: merma, regalías y degustaciones. Todos los roles; el
  //   Vendedor registra las de su tienda y solo Admin/Finanzas confirma o
  //   rechaza (con motivo).
  // - Solicitudes: pedidos de stock a planta (entradas). El Vendedor pide
  //   y sigue el estado; Admin/Finanzas atiende desde una bandeja con todas
  //   las tiendas. Comparte moduleKey con Movimientos.
  // - Registro: línea de tiempo de entradas y salidas con fecha y hora; el
  //   Vendedor ve solo la de su tienda. Comparte moduleKey con Conteo.
  {
    label: "Inventario",
    icon: Warehouse,
    group: "",
    children: [
      { label: "Conteo", href: "/dashboard/inventario", icon: Warehouse, roles: ["SUPER_ADMIN", "FINANZAS", "VENDEDOR"], moduleKey: "dashboard.inventario" },
      { label: "Solicitudes", href: "/dashboard/inventario/solicitudes", icon: PackagePlus, roles: ["SUPER_ADMIN", "FINANZAS", "VENDEDOR"], moduleKey: "dashboard.inventario-movimientos" },
      { label: "Movimientos", href: "/dashboard/inventario/movimientos", icon: PackageMinus, roles: ["SUPER_ADMIN", "FINANZAS", "VENDEDOR"], moduleKey: "dashboard.inventario-movimientos" },
      { label: "Registro", href: "/dashboard/inventario/registro", icon: ClipboardList, roles: ["SUPER_ADMIN", "FINANZAS", "VENDEDOR"], moduleKey: "dashboard.inventario" },
    ],
  },

  { label: "Administración", href: "/dashboard/admin", icon: Settings, group: "Sistema", roles: ["SUPER_ADMIN"] },
];

// Texto del globo según el rol: Admin/Finanzas ven lo que falta por atender;
// el Vendedor, novedades de lo suyo (envíos por recibir, cosas resueltas).
function badgeLabel(role: string | undefined, count: number): string {
  if (role === "VENDEDOR") return `${count} novedad${count === 1 ? "" : "es"}`;
  return `${count} por atender`;
}

// Cada pantalla de Inventario con aviso, por href.
const BADGE_HREF = {
  movements: "/dashboard/inventario/movimientos",
  requests: "/dashboard/inventario/solicitudes",
} as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);
  const { data: notifications } = useMovementNotifications();
  // El Vendedor solo ve la sección Inventario si habilitaron su tienda
  // (Administración → Inventario); Admin/Finanzas siempre la ven.
  const { canUse: canUseInventory } = useCanUseInventory();

  // Mismo NAV_ITEMS, solo con los globos de Movimientos y Solicitudes
  // inyectados — se recalcula únicamente cuando cambian los contadores o
  // el rol.
  const navItems = useMemo<DashboardNavItem[]>(() => {
    const baseItems = canUseInventory ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.label !== "Inventario");
    if (!notifications || notifications.total === 0) return baseItems;
    const countByHref: Record<string, number> = {
      [BADGE_HREF.movements]: notifications.movements,
      [BADGE_HREF.requests]: notifications.requests,
    };
    return baseItems.map((item) =>
      "children" in item
        ? {
            ...item,
            children: item.children.map((child) => {
              const count = countByHref[child.href];
              return count ? { ...child, badge: count, badgeLabel: badgeLabel(role, count) } : child;
            }),
          }
        : item,
    );
  }, [notifications, role, canUseInventory]);

  return (
    <DashboardShell navItems={navItems} dashboardHref="/dashboard">
      {children}
    </DashboardShell>
  );
}
